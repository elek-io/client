import { Outlet, createFileRoute } from '@tanstack/react-router';
import type { ReactElement } from 'react';

import { useBreadcrumb } from '@renderer/hooks/useBreadcrumb';
import { useProject } from '@renderer/hooks/useProject';
import { useQueryNoError } from '@renderer/hooks/useQueryNoError';
import { queryOptions } from '@renderer/queries';

import { type DirectStringValue } from '@elek-io/core';

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
  const firstStringValue = isReadingEntry
    ? undefined
    : Object.values(entry.values).find(
        (value): value is DirectStringValue => value.valueType === 'string'
      );
  useBreadcrumb(
    Route,
    firstStringValue === undefined
      ? undefined
      : translateContent({
          key: 'collection.name.plural',
          record: firstStringValue.content,
        })
  );

  return <Outlet />;
}
