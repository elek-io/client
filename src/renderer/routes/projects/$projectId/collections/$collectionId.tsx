import { Outlet, createFileRoute } from '@tanstack/react-router';
import type { ReactElement } from 'react';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId'
)({
  component: ProjectCollectionLayout,
});

function ProjectCollectionLayout(): ReactElement {
  return <Outlet />;
}
