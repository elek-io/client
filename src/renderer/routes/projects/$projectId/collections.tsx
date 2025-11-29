import {
  CollectionsSidebar,
  CollectionsSidebarSkeleton,
} from '@root/src/renderer/components/collections-sidebar';
import { useQueryNoError } from '@root/src/renderer/hooks/useQueryNoError';
import { queryOptions } from '@root/src/renderer/queries';
import { Outlet, createFileRoute } from '@tanstack/react-router';
import type { ReactElement } from 'react';

export const Route = createFileRoute('/projects/$projectId/collections')({
  component: ProjectCollectionsLayout,
});

function ProjectCollectionsLayout(): ReactElement {
  const { projectId } = Route.useParams();
  const { data: collections, isPending: isCollectionsPending } =
    useQueryNoError(
      queryOptions.collections.list({
        projectId,
        limit: 0,
      })
    );

  return (
    <div className="flex h-full">
      {isCollectionsPending ? (
        <CollectionsSidebarSkeleton projectId={projectId} />
      ) : (
        <CollectionsSidebar projectId={projectId} collections={collections} />
      )}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
