import { Outlet, createFileRoute } from '@tanstack/react-router';
import type { ReactElement } from 'react';

import { useBreadcrumb } from '@renderer/hooks/useBreadcrumb';
import { useProject } from '@renderer/hooks/useProject';
import { useQueryNoError } from '@renderer/hooks/useQueryNoError';
import { queryOptions } from '@renderer/queries';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId/$entryId'
)({
  component: ProjectCollectionEntryLayout,
});

function ProjectCollectionEntryLayout(): ReactElement {
  const { projectId, collectionId, entryId } = Route.useParams();
  const { translateContent } = useProject();
  const { data: entry, isPending: isReadingEntry } = useQueryNoError(
    queryOptions.entries.read({
      projectId,
      collectionId,
      id: entryId,
    })
  );
  // @todo Should use User defined title field instead of first value
  useBreadcrumb(
    Route,
    isReadingEntry ||
      entry.values[0] === undefined ||
      entry.values[0].valueType !== 'string'
      ? undefined
      : translateContent({
          key: 'collection.name.plural',
          record: entry.values[0].content,
        })
  );

  return <Outlet />;
}
