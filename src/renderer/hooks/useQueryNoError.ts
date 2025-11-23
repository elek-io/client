import {
  type DefaultError,
  type QueryClient,
  type QueryKey,
  type QueryObserverLoadingResult,
  type QueryObserverPendingResult,
  type QueryObserverPlaceholderResult,
  type QueryObserverSuccessResult,
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';

export type UseQueryResultNoError<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
> =
  | QueryObserverSuccessResult<NoInfer<TData>, TError>
  | QueryObserverLoadingResult<NoInfer<TData>, TError>
  | QueryObserverPendingResult<NoInfer<TData>, TError>
  | QueryObserverPlaceholderResult<NoInfer<TData>, TError>;

/**
 * A wrapper around useQuery that ensures the correct type is returned when `throwOnError` is set to `true`
 *
 * Setting `throwOnError: true` in the queryOptions propagates errors to the nearest error boundary
 * but that doesn't change the TypeScript type which still is `T | undefined`.
 * We therefore would have to manually check for errors every time we use useQuery
 * with `throwOnError: true`, just to satisfy TypeScript.
 *
 * This hook wraps useQuery and throws the error if it exists, so that the returned type
 * no longer includes the error state.
 *
 * It also logs an error if `throwOnError` is not set to `true`.
 *
 * @example
 * const { data, isPending } = useQueryNoError(options);
 * if (isPending) return <Loading />;
 * // data is now guaranteed to be defined
 * return <Component data={data} />;
 */
export function useQueryNoError<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient
): UseQueryResultNoError<TQueryFnData, TError, TData> {
  const query = useQuery(options, queryClient);

  if (options.throwOnError === undefined || options.throwOnError === false) {
    void window.ipc.core.logger.error({
      source: 'desktop',
      message: `useQueryNoError called for queryKey "${JSON.stringify(
        options.queryKey
      )}" without throwOnError set to true`,
    });
  }

  if (query.isError) {
    throw query.error;
  }

  return query;
}
