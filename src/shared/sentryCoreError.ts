import { parseIpcError } from './ipcError.js';

/**
 * The subset of Sentry's `StackFrame` this module reads and rewrites to
 * symbolicate Core frames. Sentry's `StackFrame` has both fields optional, so
 * it satisfies this structurally and the module needs no Sentry import.
 */
interface CoreStackFrameLike {
  filename?: string;
  abs_path?: string;
}

/**
 * The minimal shape of a Sentry error event this transform reads and rewrites.
 * Both `@sentry/electron/main` and `@sentry/react` `ErrorEvent`s satisfy it
 * structurally, so this module needs no process-specific Sentry import and
 * stays bundleable into both processes (like [`ipcError.ts`](./ipcError.ts)).
 * `TFrame` is Sentry's `StackFrame`, constrained only to the fields we rewrite
 * so it is inferred from the injected parser rather than imported. A shape drift
 * in the SDK surfaces as an assignability error at the call site.
 */
interface SentryErrorEventLike<TFrame> {
  exception?: {
    values?: {
      type?: string;
      value?: string;
      stacktrace?: { frames?: TFrame[] };
    }[];
  };
  tags?: Record<string, unknown>;
}

/**
 * Core ships as one bundled node file. A forwarded frame points at it by a
 * runtime path that varies per platform and install, for example
 * `file:///.../app.asar/node_modules/@elek-io/core/dist/node/index.node.mjs`.
 * Detect it by this suffix.
 */
const CORE_NODE_BUILD = 'node_modules/@elek-io/core/dist/node/index.node.mjs';

/**
 * The stable name the CD step uploads Core's node source map under (see
 * `.github/workflows/cd.yml`). Rewriting the varying runtime path to this lets
 * Sentry match the release artifact and resolve the frame to Core's TypeScript
 * source. `app:///` mirrors what `@sentry/electron` uses for its own frames, and
 * the upload registers the matching `~/` artifact. Keep the two in sync.
 */
const CORE_NODE_ARTIFACT = `app:///${CORE_NODE_BUILD}`;

/**
 * Rewrites a Core frame's varying runtime path to the canonical artifact name so
 * Sentry can symbolicate it. Non-Core frames pass through untouched. Mutates the
 * frame, which is freshly built by the parser, and returns it for `map`.
 */
function normalizeCoreFrame<TFrame extends CoreStackFrameLike>(
  frame: TFrame
): TFrame {
  if (
    frame.filename?.includes(CORE_NODE_BUILD) === true ||
    frame.abs_path?.includes(CORE_NODE_BUILD) === true
  ) {
    frame.filename = CORE_NODE_ARTIFACT;
    frame.abs_path = CORE_NODE_ARTIFACT;
  }
  return frame;
}

/**
 * Sentry `beforeSend` transform. When a captured error carries a serialized
 * CoreError (see [`serializeCoreError`](./ipcError.ts), encoded at the IPC
 * boundary), this restores what the boundary stripped: a readable message, the
 * `CoreError` label instead of the generic rethrown `Error`, and the specific
 * type as a `core_error_type` tag for filtering. Given a `parseStack` (Sentry's
 * `defaultStackParser`), it also rebuilds the exception stacktrace from Core's
 * origin stack, since the renderer-side IPC error is frameless. Mutates the
 * event in place and is a no-op for any error without an encoded CoreError, so
 * plain errors and non-error events pass through untouched.
 */
export function decodeCoreErrorForSentry<TFrame extends CoreStackFrameLike>(
  event: SentryErrorEventLike<TFrame>,
  parseStack?: (stack: string) => TFrame[]
): void {
  const values = event.exception?.values;
  if (values === undefined) {
    return;
  }

  for (const value of values) {
    if (value.value === undefined) {
      continue;
    }

    const { type, message, stack } = parseIpcError(value.value);
    if (type === undefined) {
      continue;
    }

    value.value = message;
    value.type = 'CoreError';
    // The renderer-side IPC error has no frames, so rebuild the stacktrace from
    // Core's forwarded origin stack when a parser is available. Frames pointing
    // at Core's node build get their varying runtime path rewritten to the
    // canonical artifact name so Sentry can symbolicate them to Core's source.
    if (stack !== undefined && parseStack !== undefined) {
      value.stacktrace = { frames: parseStack(stack).map(normalizeCoreFrame) };
    }
    event.tags = { ...event.tags, core_error_type: type };
  }
}
