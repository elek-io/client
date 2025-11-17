import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import type { ReactElement } from 'react';

import { UserHeader } from '@renderer/components/user-header';

import { queryClient, queryOptions } from '../queries';

export const Route = createFileRoute('/projects')({
  beforeLoad: async () => {
    const user = await queryClient.ensureQueryData(queryOptions.user.get());
    if (!user) {
      throw redirect({
        to: '/user/profile',
      });
    }

    return { user };
  },
  component: ProjectsLayout,
});

function ProjectsLayout(): ReactElement {
  const { user } = Route.useRouteContext();

  return (
    <>
      <UserHeader user={user} />
      <Outlet />
    </>
  );
}
