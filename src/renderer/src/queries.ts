import {
  CloneProjectProps,
  ListProjectsProps,
  PaginatedList,
  Project,
} from '@elek-io/core';
import {
  queryOptions,
  useMutation,
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';
import { ipc } from './ipc';

export const userQueryOptions = queryOptions({
  queryKey: ['user'],
  queryFn: ipc.core.user.get,
});

export function useUser() {
  return useQuery(userQueryOptions);
}

export const projectsQueryOptions = (props?: ListProjectsProps) => {
  return queryOptions({
    queryKey: ['projects', props],
    queryFn: () => ipc.core.projects.list(props),
  });
};

export function useProjects(
  props?: ListProjectsProps
): UseQueryResult<PaginatedList<Project>> {
  return useQuery(projectsQueryOptions(props));
}

export function useCloneProject() {
  return useMutation({
    mutationFn: (props: CloneProjectProps) => ipc.core.projects.clone(props),
  });
}
