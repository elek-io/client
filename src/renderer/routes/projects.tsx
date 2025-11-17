import { createFileRoute, Outlet } from '@tanstack/react-router';
import type { ReactElement } from 'react';

export const Route = createFileRoute('/projects')({
  component: ProjectsLayout,
});

function ProjectsLayout(): ReactElement {
  return <Outlet />;
}
