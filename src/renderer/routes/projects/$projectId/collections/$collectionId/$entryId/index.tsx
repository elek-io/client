import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId/$entryId/'
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/projects/$projectId/collections/$collectionId/$entryId/update',
      params: {
        projectId: params.projectId,
        collectionId: params.collectionId,
        entryId: params.entryId,
      },
    });
  },
});
