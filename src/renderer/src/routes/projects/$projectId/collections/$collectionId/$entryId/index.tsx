import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId/$entryId/'
)({
  beforeLoad: ({ context, params }) => {
    throw redirect({
      to: '/projects/$projectId/collections/$collectionId/$entryId/update',
      params: {
        projectId: params.projectId,
        collectionId: context.currentCollection.id,
        entryId: params.entryId,
      },
    });
  },
});
