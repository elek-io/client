import { createFileRoute, Outlet } from '@tanstack/react-router';
import type { ReactElement } from 'react';

import { useBreadcrumb } from '@renderer/hooks/useBreadcrumb';

export const Route = createFileRoute('/user')({
  component: UserLayout,
});

function UserLayout(): ReactElement {
  useBreadcrumb(Route, 'User');

  return <Outlet />;
}
