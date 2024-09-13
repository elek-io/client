import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/projects/$projectId/collections/')({
  beforeLoad: ({ context, params }) => {
    if (!context.collections.list[0]) {
      throw redirect({
        to: '/projects/$projectId/collections/create',
        params: { projectId: params.projectId },
      });
    }

    throw redirect({
      to: '/projects/$projectId/collections/$collectionId',
      params: {
        projectId: params.projectId,
        collectionId: context.collections.list[0].id,
      },
    });
  },
});
