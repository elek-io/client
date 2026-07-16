import { parseIpcError } from '@root/src/shared/ipcError';
import {
  useMutation,
  type DefaultError,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query';

import { type CoreErrorType } from '@elek-io/core';

/**
 * A map from a `CoreError` type to the in-place handler that drives the UI for
 * it. Its keys are the single source of truth for the "expected" set: the
 * mutation's `throwOnError` predicate and the `handleError` dispatcher both read
 * this map, so they can never drift.
 */
export type CoreErrorHandlers = Partial<
  Record<CoreErrorType, (error: unknown) => void>
>;

export type UseAppMutationResult<TData, TError, TVariables, TContext> =
  UseMutationResult<TData, TError, TVariables, TContext> & {
    /**
     * Call this from the `catch` of an `await mutateAsync(...)`. It reads the
     * failure's `CoreError` type and runs the matching `handled` callback, if any.
     * An unhandled type is a no-op here: `throwOnError` has already routed it to
     * the root error boundary, which logs and reports it.
     */
    handleError: (error: unknown) => void;
  };

/**
 * The single home for handling an expected `CoreError` by type in place, instead
 * of letting it take over the screen through the root error boundary.
 *
 * Wraps `useMutation` and, from the `handled` map, sets `throwOnError` to a
 * predicate that returns `false` only for the handled types (so just those reach
 * the caller's `catch` and every other failure still hits the boundary) plus a
 * no-op `onError` (so the wrapper's toast/log is suppressed for this mutation).
 * Never a blanket `throwOnError: false`. See contributing/error-handling.md.
 *
 * @example
 * const { mutateAsync, handleError } = useAppMutation(queryOptions.entries.create, {
 *   handled: {
 *     Conflict: (error) => {
 *       setConflictError(error);
 *       setIsConflictDialogOpen(true);
 *     },
 *   },
 * });
 * // ...
 * try {
 *   await mutateAsync(props);
 *   await router.navigate({ ... });
 * } catch (error) {
 *   handleError(error);
 * }
 */
export function useAppMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
  config: { handled: CoreErrorHandlers }
): UseAppMutationResult<TData, TError, TVariables, TContext> {
  const { handled } = config;

  const mutation = useMutation<TData, TError, TVariables, TContext>({
    ...options,
    // Opt out of the boundary only for the handled types; every other failure
    // (and any non-CoreError, which carries no type) still propagates. The
    // handled set lives in `handled`, so this predicate can never fall out of
    // sync with the dispatch below.
    throwOnError: (error) => {
      const { type } = parseIpcError(error);
      return type === undefined || handled[type] === undefined;
    },
    // The in-place surface reacts to a handled type, so suppress the wrapper's
    // error toast and log for this mutation. An unhandled type still reaches the
    // boundary via throwOnError above, which logs and reports it as usual.
    onError: () => {},
  });

  const handleError = (error: unknown): void => {
    const { type } = parseIpcError(error);
    const handler = type !== undefined ? handled[type] : undefined;
    handler?.(error);
  };

  return Object.assign(mutation, { handleError });
}
