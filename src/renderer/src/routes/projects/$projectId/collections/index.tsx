import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/projects/$projectId/collections/')({
  beforeLoad: async ({ params }) => {
    throw redirect({
      to: '/projects/$projectId/collections/create',
      params: { projectId: params.projectId },
    });
  },
});
