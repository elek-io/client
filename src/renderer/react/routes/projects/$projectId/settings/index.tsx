import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/projects/$projectId/settings/')({
  beforeLoad: ({ context, params }) => {
    throw redirect({
      to: '/projects/$projectId/settings/general',
      params: {
        projectId: params.projectId,
      },
    });
  },
});
