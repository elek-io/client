import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId'
)({
  beforeLoad: async ({ context, params }) => {
    const currentCollection = await context.core.collections.read({
      projectId: params.projectId,
      id: params.collectionId,
    });
    const currentEntries = await context.core.entries.list({
      projectId: params.projectId,
      collectionId: params.collectionId,
    });

    return { currentCollection, currentEntries };
  },
  component: ProjectCollectionLayout,
});

function ProjectCollectionLayout() {
  return <Outlet></Outlet>;
}
