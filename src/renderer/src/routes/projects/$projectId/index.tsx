import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/projects/$projectId/')({
  beforeLoad: () => {
    throw redirect({
      to: '/projects/$projectId/dashboard',
    });
  },
});
