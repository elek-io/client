import { collectionQueryOptions } from '@renderer/queries';
import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId'
)({
  beforeLoad: async ({ context, params }) => {
    const collection = await context.queryClient.fetchQuery(
      collectionQueryOptions({
        projectId: params.projectId,
        id: params.collectionId,
      })
    );

    // Probably not needed, since the index.tsx does this query directly while paginating
    // const currentEntries = await context.core.entries.list({
    //   projectId: params.projectId,
    //   collectionId: params.collectionId,
    // });

    return { collection };
  },
  component: ProjectCollectionLayout,
});

function ProjectCollectionLayout(): JSX.Element {
  return <Outlet></Outlet>;
}
