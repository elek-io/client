# Loading and updating data

elek.io Client uses [TanStack Query](https://tanstack.com/query/latest) to load (query) and update (mutate) data.

Base configuration for all queries and mutations can be found inside the [`client.ts` file](../../src/renderer/queries/client.ts). Here, `staleTime` is set to `Infinity` which keeps all queries `fresh`, meaning they are not refetched if a query with the same `queryKey` is executed. Additionally all mutations trigger either a success or failure toast.

All `queryOptions` and `mutationOptions` are configured in the [`options.ts` file](../../src/renderer/queries/options.ts). They often share the same cache and can automatically update each others cache when data changes to avoid having to manually invalidate their cache and force a refetch.

## Querying data

Wherever possible we query data without blocking loading and rendering the page where the data is displayed. Changing pages should feel instantanious. If a query takes some time to resolve, we show a Skeleton component instead. See the [Project's `index.tsx` file](../../src/renderer/routes/projects/index.tsx) for an example.

## Mutating data

When mutating data we often render a form with it's values being the current data of a query. But when the page loads, the query is executed and might not be resolved yet for the first page render.
To avoid a loading spinner or creating and showing a Skeleton for each and every form, we disable the form with an `fieldset` HTML element as long as the query is not finished. See the [Users `profile.tsx` file](../../src/renderer/routes/user/profile.tsx) for an example.
