import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId'
)({
  beforeLoad: async ({ context, params }) => {
    const currentCollection = await context.core.collections.read({
      projectId: params.projectId,
      id: params.collectionId,
    });

    // Probably not needed, since the index.tsx does this query directly while paginating
    // const currentEntries = await context.core.entries.list({
    //   projectId: params.projectId,
    //   collectionId: params.collectionId,
    // });

    return { currentCollection };
  },
  component: ProjectCollectionLayout,
});

function ProjectCollectionLayout(): JSX.Element {
  return <Outlet></Outlet>;
}
