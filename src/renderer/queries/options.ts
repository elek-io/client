import { mutationOptions, queryOptions } from '@tanstack/react-query';

import {
  type Asset,
  type Collection,
  type CreateAssetProps,
  type CreateCollectionProps,
  type CreateProjectProps,
  type DeleteAssetProps,
  type DeleteCollectionProps,
  type DeleteProjectProps,
  type ListAssetsProps,
  type ListCollectionsProps,
  type ListProjectsProps,
  type PaginatedList,
  type Project,
  type ReadAssetProps,
  type ReadCollectionProps,
  type ReadProjectProps,
  type SetUserProps,
  type UpdateAssetProps,
  type UpdateCollectionProps,
  type UpdateProjectProps,
} from '@elek-io/core';

import { queryClient } from './client';

/**
 * Query and Mutation options for Tanstack Query that wrap IPC calls to the main process.
 */
export default {
  projects: {
    create: (props: CreateProjectProps) =>
      mutationOptions({
        mutationFn: async () => {
          return await window.ipc.core.projects.create(props);
        },
        meta: {
          method: 'create',
          objectType: 'project',
        },
        onSuccess: (createdProject, _variables, _onMutateResult, context) => {
          // Add Project to cache individually
          context.client.setQueryData(
            ['projects', createdProject.id],
            createdProject
          );

          // And update the Projects list cache too
          context.client.setQueryData(
            ['projects'],
            (old: PaginatedList<Project>) => {
              return {
                total: old.total + 1,
                limit: old.limit,
                offset: old.offset,
                list: [...old.list, createdProject],
              };
            }
          );
        },
      }),
    read: (props: ReadProjectProps) =>
      queryOptions({
        queryKey: ['projects', props.id],
        queryFn: async () => {
          return await window.ipc.core.projects.read(props);
        },
      }),
    update: (props: UpdateProjectProps) =>
      mutationOptions({
        mutationFn: async () => {
          return await window.ipc.core.projects.update(props);
        },
        meta: {
          method: 'update',
          objectType: 'project',
        },
        onSuccess: (updatedProject, _variables, _onMutateResult, context) => {
          // Update Project in cache individually
          context.client.setQueryData(
            ['projects', updatedProject.id],
            updatedProject
          );

          // And update the Projects list cache too
          context.client.setQueryData(
            ['projects'],
            (old: PaginatedList<Project>) => {
              return {
                total: old.total,
                limit: old.limit,
                offset: old.offset,
                list: old.list.map((oldProject) =>
                  oldProject.id === updatedProject.id
                    ? updatedProject
                    : oldProject
                ),
              };
            }
          );
        },
      }),
    delete: (props: DeleteProjectProps) =>
      mutationOptions({
        mutationFn: async () => {
          return await window.ipc.core.projects.delete(props);
        },
        meta: {
          method: 'delete',
          objectType: 'project',
        },
        onSuccess: (_deletedProject, _variables, _onMutateResult, context) => {
          // Remove Project from cache individually
          context.client.setQueryData(['projects', props.id], undefined);

          // And update the Projects list cache too
          context.client.setQueryData(
            ['projects'],
            (old: PaginatedList<Project>) => {
              return {
                total: old.total - 1,
                limit: old.limit,
                offset: old.offset,
                list: old.list.filter(
                  (oldProject) => oldProject.id !== props.id
                ),
              };
            }
          );
        },
      }),
    list: (props: ListProjectsProps) =>
      queryOptions({
        queryKey: ['projects'],
        queryFn: async () => {
          const projects = await window.ipc.core.projects.list(props);

          // Cache each project individually too
          // so that we can access them directly without refetching later
          projects.list.forEach((project) => {
            queryClient.setQueryData(['projects', project.id], project);
          });

          return projects;
        },
      }),
    clone: mutationOptions({
      mutationFn: window.ipc.core.projects.clone,
      meta: {
        method: 'clone',
        objectType: 'project',
      },
      onSuccess: (clonedProject, _variables, _onMutateResult, context) => {
        // Add Project to cache individually
        context.client.setQueryData(
          ['projects', clonedProject.id],
          clonedProject
        );

        // And update the Projects list cache too
        context.client.setQueryData(
          ['projects'],
          (old: PaginatedList<Project>) => {
            return {
              total: old.total + 1,
              limit: old.limit,
              offset: old.offset,
              list: [...old.list, clonedProject],
            };
          }
        );
      },
    }),
    getChanges: (project: Project) =>
      queryOptions({
        enabled: project.remoteOriginUrl !== null,
        queryKey: ['projects', project.id, 'changes'],
        queryFn: async () => {
          return await window.ipc.core.projects.getChanges({
            id: project.id,
          });
        },
        // Refetch the data every 3 minutes
        refetchInterval: 180000,
      }),
    synchronize: (project: Project) =>
      mutationOptions({
        mutationFn: window.ipc.core.projects.synchronize,
        meta: {
          method: 'synchronize',
          objectType: 'project',
        },
        onSuccess: async (_data, _variables, _onMutateResult, context) => {
          // On synchronization anything inside the Project may have changed
          // so we invalidate it entirely
          await context.client.invalidateQueries({
            queryKey: ['projects', project.id],
            refetchType: 'all',
          });
        },
      }),
  },
  collections: {
    create: (props: CreateCollectionProps) =>
      mutationOptions({
        mutationFn: async () => {
          return await window.ipc.core.collections.create(props);
        },
        meta: {
          method: 'create',
          objectType: 'collection',
        },
        onSuccess: (
          createdCollection,
          _variables,
          _onMutateResult,
          context
        ) => {
          // Add Collection to cache individually
          context.client.setQueryData(
            ['projects', props.projectId, 'collections', createdCollection.id],
            createdCollection
          );

          // And update the Collections list cache too
          context.client.setQueryData(
            ['projects', props.projectId, 'collections'],
            (old: PaginatedList<Collection>) => {
              return {
                total: old.total + 1,
                limit: old.limit,
                offset: old.offset,
                list: [...old.list, createdCollection],
              };
            }
          );
        },
      }),
    read: (props: ReadCollectionProps) =>
      queryOptions({
        queryKey: ['projects', props.projectId, 'collections', props.id],
        queryFn: async () => {
          return await window.ipc.core.collections.read(props);
        },
      }),
    update: (props: UpdateCollectionProps) =>
      mutationOptions({
        mutationFn: async () => {
          return await window.ipc.core.collections.update(props);
        },
        meta: {
          method: 'update',
          objectType: 'collection',
        },
        onSuccess: (
          updatedCollection,
          _variables,
          _onMutateResult,
          context
        ) => {
          // Update Collection in cache individually
          context.client.setQueryData(
            ['projects', props.projectId, 'collections', updatedCollection.id],
            updatedCollection
          );

          // And update the Collections list cache too
          context.client.setQueryData(
            ['projects', props.projectId, 'collections'],
            (old: PaginatedList<Collection>) => {
              return {
                total: old.total,
                limit: old.limit,
                offset: old.offset,
                list: old.list.map((oldCollection) =>
                  oldCollection.id === updatedCollection.id
                    ? updatedCollection
                    : oldCollection
                ),
              };
            }
          );
        },
      }),
    delete: (props: DeleteCollectionProps) =>
      mutationOptions({
        mutationFn: async () => {
          return await window.ipc.core.collections.delete(props);
        },
        meta: {
          method: 'delete',
          objectType: 'collection',
        },
        onSuccess: (
          _deletedCollection,
          _variables,
          _onMutateResult,
          context
        ) => {
          // Remove Collection from cache individually
          context.client.setQueryData(
            ['projects', props.projectId, 'collections', props.id],
            undefined
          );

          // And update the Collections list cache too
          context.client.setQueryData(
            ['projects', props.projectId, 'collections'],
            (old: PaginatedList<Collection>) => {
              return {
                total: old.total - 1,
                limit: old.limit,
                offset: old.offset,
                list: old.list.filter(
                  (oldCollection) => oldCollection.id !== props.id
                ),
              };
            }
          );
        },
      }),
    list: (props: ListCollectionsProps) =>
      queryOptions({
        queryKey: ['projects', props.projectId, 'collections'],
        queryFn: async () => {
          const collections = await window.ipc.core.collections.list(props);

          // Cache each collection individually too
          // so that we can access them directly without refetching later
          collections.list.forEach((collection) => {
            queryClient.setQueryData(
              ['projects', props.projectId, 'collections', collection.id],
              collection
            );
          });

          return collections;
        },
      }),
  },
  assets: {
    create: (props: CreateAssetProps) =>
      mutationOptions({
        mutationFn: async () => {
          return await window.ipc.core.assets.create(props);
        },
        meta: {
          method: 'create',
          objectType: 'asset',
        },
        onSuccess: (createdAsset, _variables, _onMutateResult, context) => {
          // Add Asset to cache individually
          context.client.setQueryData(
            ['projects', props.projectId, 'assets', createdAsset.id],
            createdAsset
          );

          // And update the Assets list cache too
          context.client.setQueryData(
            ['projects', props.projectId, 'assets'],
            (old: PaginatedList<Asset>) => {
              return {
                total: old.total + 1,
                limit: old.limit,
                offset: old.offset,
                list: [...old.list, createdAsset],
              };
            }
          );
        },
      }),
    read: (props: ReadAssetProps) =>
      queryOptions({
        queryKey: ['projects', props.projectId, 'assets', props.id],
        queryFn: async () => {
          return await window.ipc.core.assets.read(props);
        },
      }),
    update: (props: UpdateAssetProps) =>
      mutationOptions({
        mutationFn: async () => {
          return await window.ipc.core.assets.update(props);
        },
        meta: {
          method: 'update',
          objectType: 'asset',
        },
        onSuccess: (updatedAsset, _variables, _onMutateResult, context) => {
          // Update Asset in cache individually
          context.client.setQueryData(
            ['projects', props.projectId, 'assets', updatedAsset.id],
            updatedAsset
          );

          // And update the Assets list cache too
          context.client.setQueryData(
            ['projects', props.projectId, 'assets'],
            (old: PaginatedList<Asset>) => {
              return {
                total: old.total,
                limit: old.limit,
                offset: old.offset,
                list: old.list.map((oldAsset) =>
                  oldAsset.id === updatedAsset.id ? updatedAsset : oldAsset
                ),
              };
            }
          );
        },
      }),
    delete: (props: DeleteAssetProps) =>
      mutationOptions({
        mutationFn: async () => {
          return await window.ipc.core.assets.delete(props);
        },
        meta: {
          method: 'delete',
          objectType: 'asset',
        },
        onSuccess: (_deletedAsset, _variables, _onMutateResult, context) => {
          // Remove Asset from cache individually
          context.client.setQueryData(
            ['projects', props.projectId, 'assets', props.id],
            undefined
          );

          // And update the Assets list cache too
          context.client.setQueryData(
            ['projects', props.projectId, 'assets'],
            (old: PaginatedList<Asset>) => {
              return {
                total: old.total - 1,
                limit: old.limit,
                offset: old.offset,
                list: old.list.filter((oldAsset) => oldAsset.id !== props.id),
              };
            }
          );
        },
      }),
    list: (props: ListAssetsProps) =>
      queryOptions({
        queryKey: ['projects', props.projectId, 'assets'],
        queryFn: async () => {
          const assets = await window.ipc.core.assets.list(props);

          // Cache each asset individually too
          // so that we can access them directly without refetching later
          assets.list.forEach((asset) => {
            queryClient.setQueryData(
              ['projects', props.projectId, 'assets', asset.id],
              asset
            );
          });

          return assets;
        },
      }),
  },
  user: {
    get: () =>
      queryOptions({
        queryKey: ['user'],
        queryFn: async () => {
          return await window.ipc.core.user.get();
        },
      }),
    set: (props: SetUserProps) =>
      mutationOptions({
        mutationFn: async () => {
          return await window.ipc.core.user.set(props);
        },
        meta: {
          method: 'set',
          objectType: 'user',
        },
        onSuccess: (updatedUser, _variables, _onMutateResult, context) => {
          context.client.setQueryData(['user'], updatedUser);
        },
      }),
  },
};
