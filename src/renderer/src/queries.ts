/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  ListAssetsProps,
  ListCollectionsProps,
  ListEntriesProps,
  ListProjectsProps,
  Project,
  ReadCollectionProps,
  ReadProjectProps,
} from '@elek-io/core';
import { queryOptions } from '@tanstack/react-query';
import { ipc } from './ipc';

// Rule of thumb: a List of Objects should be loaded with a useQuery hook
// so that it's not blocking the initial render of the page and can be loaded in the background,
// indicated with a Skeleton loader to the user.
// Whereas a single Object should be loaded within the beforeLoad function of a Route if it's data is required.
// To optimize the loading of single objects (e.g. between Route changes), it's staleTime should be set to Infinity.
//

export const userQueryOptions = queryOptions({
  queryKey: ['user'],
  queryFn: ipc.core.user.get,
  staleTime: Infinity,
});

export const projectsQueryOptions = (props?: ListProjectsProps) => {
  return queryOptions({
    queryKey: ['projects', props],
    queryFn: () => ipc.core.projects.list(props),
  });
};

export const projectQueryOptions = (props: ReadProjectProps) => {
  return queryOptions({
    queryKey: ['project', props],
    queryFn: () => ipc.core.projects.read(props),
    staleTime: Infinity,
  });
};

export const projectChangesQueryOptions = (project: Project) => {
  return queryOptions({
    enabled: project.remoteOriginUrl !== null,
    queryKey: ['project-changes', project.id],
    queryFn: () => ipc.core.projects.getChanges({ id: project.id }),
    // Refetch the data every 3 minutes
    refetchInterval: 1000 * 60 * 3,
  });
};

export const assetsQueryOptions = (props: ListAssetsProps) => {
  return queryOptions({
    queryKey: ['assets', props],
    queryFn: () => ipc.core.assets.list(props),
  });
};

export const collectionsQueryOptions = (props: ListCollectionsProps) => {
  return queryOptions({
    queryKey: ['collections', props],
    queryFn: () => ipc.core.collections.list(props),
  });
};

export const collectionQueryOptions = (props: ReadCollectionProps) => {
  return queryOptions({
    queryKey: ['collection', props],
    queryFn: () => ipc.core.collections.read(props),
  });
};

export const entriesQueryOptions = (props: ListEntriesProps) => {
  return queryOptions({
    queryKey: ['entries', props],
    queryFn: () => ipc.core.entries.list(props),
  });
};

export const isApiRunningQueryOptions = queryOptions({
  queryKey: ['api', 'is-running'],
  queryFn: () => ipc.core.api.isRunning(),
});
