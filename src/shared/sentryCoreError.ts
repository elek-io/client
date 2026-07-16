import { parseIpcError } from './ipcError.js';

/**
 * The minimal shape of a Sentry error event this transform reads and rewrites.
 * Both `@sentry/electron/main` and `@sentry/react` `ErrorEvent`s satisfy it
 * structurally, so this module needs no process-specific Sentry import and
 * stays bundleable into both processes (like [`ipcError.ts`](./ipcError.ts)).
 * `TFrame` is Sentry's `StackFrame`, kept generic so it is inferred from the
 * injected parser rather than imported. A shape drift in the SDK surfaces as an
 * assignability error at the call site.
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
export function decodeCoreErrorForSentry<TFrame>(
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
    // Core's forwarded origin stack when a parser is available.
    if (stack !== undefined && parseStack !== undefined) {
      value.stacktrace = { frames: parseStack(stack) };
    }
    event.tags = { ...event.tags, core_error_type: type };
  }
}
