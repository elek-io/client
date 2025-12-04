import { Outlet, createFileRoute } from '@tanstack/react-router';
import type { ReactElement } from 'react';

import { useBreadcrumb } from '@renderer/hooks/useBreadcrumb';
import { useProject } from '@renderer/hooks/useProject';
import { useQueryNoError } from '@renderer/hooks/useQueryNoError';
import { queryOptions } from '@renderer/queries';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId'
)({
  component: ProjectCollectionLayout,
});

function ProjectCollectionLayout(): ReactElement {
  const { projectId, collectionId } = Route.useParams();
  const { translateContent } = useProject();
  const { data: collection, isPending: isReadingCollection } = useQueryNoError(
    queryOptions.collections.read({
      projectId: projectId,
      id: collectionId,
    })
  );
  useBreadcrumb(
    Route,
    isReadingCollection
      ? undefined
      : translateContent({
          key: 'collection.name.plural',
          record: collection.name.plural,
        })
  );

  return <Outlet />;
}
