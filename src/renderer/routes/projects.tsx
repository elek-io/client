import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import type { ReactElement } from 'react';

import { useBreadcrumb } from '@renderer/hooks/useBreadcrumb';
import { queryClient, queryOptions } from '@renderer/queries';

export const Route = createFileRoute('/projects')({
  component: ProjectsLayout,
  loader: async () => {
    const user = await queryClient.ensureQueryData(queryOptions.user.get());

    if (!user) {
      throw redirect({
        to: '/user/profile',
      });
    }
  },
});

function ProjectsLayout(): ReactElement {
  useBreadcrumb(Route, 'Projects');

  return <Outlet />;
}
