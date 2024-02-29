import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/projects/$projectId/collections/')({
  beforeLoad: ({ context, params }) => {
    if (context.currentCollections.total === 0) {
      throw redirect({
        to: '/projects/$projectId/collections/create',
      });
    }

    throw redirect({
      to: '/projects/$projectId/collections/$collectionId/',
      params: {
        projectId: params.projectId,
        collectionId: context.currentCollections.list[0].id,
      },
    });
  },
});
