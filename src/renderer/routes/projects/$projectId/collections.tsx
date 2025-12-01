import { Outlet, createFileRoute } from '@tanstack/react-router';
import type { ReactElement } from 'react';

import {
  CollectionsSidebar,
  CollectionsSidebarSkeleton,
} from '@renderer/components/collections-sidebar';
import { useQueryNoError } from '@renderer/hooks/useQueryNoError';
import { queryOptions } from '@renderer/queries';

export const Route = createFileRoute('/projects/$projectId/collections')({
  component: ProjectCollectionsLayout,
});

function ProjectCollectionsLayout(): ReactElement {
  const { projectId } = Route.useParams();
  const { data: collections, isPending: isListingCollections } =
    useQueryNoError(
      queryOptions.collections.list({
        projectId,
        limit: 0,
      })
    );

  return (
    <div className="flex h-full">
      {isListingCollections ? (
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
