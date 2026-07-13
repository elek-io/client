import { type CoreErrorType } from '@elek-io/core';

/**
 * Cross-process helpers to preserve a CoreError's `type` across the IPC
 * boundary. Electron serializes a thrown error to the plain Error shape
 * (message and stack), so the CoreError subclass and its `type`/`statusCode`
 * are dropped. The main process encodes the type into the message with a
 * sentinel, and the renderer decodes it back out.
 *
 * This module stays free of process-specific imports so electron-vite can
 * bundle it into both the main and the renderer build. It imports CoreErrorType
 * type-only, so it carries no runtime dependency on Core.
 */

/** Marks a message as a serialized CoreError. Unlikely to collide with real copy. */
export const IPC_CORE_ERROR_SENTINEL = '__elekio_core_error__';

// The known CoreErrorType values, so the renderer can validate a decoded type
// without importing Core at runtime. `satisfies` keeps this list honest.
const coreErrorTypes = new Set<string>([
  'NotFound',
  'BadRequest',
  'Unauthorized',
  'Conflict',
  'PreconditionFailed',
  'UpgradeFailed',
  'Internal',
] satisfies CoreErrorType[]);

function isCoreErrorType(value: unknown): value is CoreErrorType {
  return typeof value === 'string' && coreErrorTypes.has(value);
}

/**
 * Encodes a CoreError's type, message and stack into a single message string.
 * Called in the main process before re-throwing, so all three survive IPC. The
 * stack is Core's own origin stack, which the renderer-side IPC error lacks
 * (Electron reconstructs a frameless error). `undefined` stack is simply
 * omitted by JSON.stringify.
 */
export function serializeCoreError(
  type: CoreErrorType,
  message: string,
  stack?: string
): string {
  return `${IPC_CORE_ERROR_SENTINEL}${JSON.stringify({ type, message, stack })}`;
}

/**
 * Decodes an error received in the renderer back into its type and message.
 * Locates the sentinel by substring, so it is robust to Electron prefixing the
 * message (e.g. "Error invoking remote method ..."). Falls back to the raw
 * message for non-CoreError errors (route or plain JS errors) and any malformed
 * payload, so `type` is simply absent then.
 */
export function parseIpcError(error: unknown): {
  type?: CoreErrorType;
  message: string;
  stack?: string;
} {
  const raw = error instanceof Error ? error.message : String(error);
  const sentinelIndex = raw.indexOf(IPC_CORE_ERROR_SENTINEL);

  if (sentinelIndex === -1) {
    return { message: raw };
  }

  const payload = raw.slice(sentinelIndex + IPC_CORE_ERROR_SENTINEL.length);

  try {
    const parsed: unknown = JSON.parse(payload);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'type' in parsed &&
      'message' in parsed
    ) {
      const { type, message } = parsed;
      if (isCoreErrorType(type) && typeof message === 'string') {
        const stack =
          'stack' in parsed && typeof parsed.stack === 'string'
            ? parsed.stack
            : undefined;
        return stack === undefined
          ? { type, message }
          : { type, message, stack };
      }
    }
  } catch {
    // Malformed payload, fall back to the raw message below
  }

  return { message: raw };
}
