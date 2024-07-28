import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId/$entryId'
)({
  beforeLoad: async ({ context, params }) => {
    const currentEntry = await context.core.entries.read({
      projectId: params.projectId,
      collectionId: params.collectionId,
      id: params.entryId,
    });

    return { currentEntry };
  },
  component: ProjectCollectionEntryLayout,
});

function ProjectCollectionEntryLayout(): JSX.Element {
  return <Outlet></Outlet>;
}
