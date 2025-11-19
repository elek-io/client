import { mutationOptions, queryOptions } from '@tanstack/react-query';

import {
  type Asset,
  type Collection,
  type CreateCollectionProps,
  type CreateEntryProps,
  type CreateProjectProps,
  type DeleteCollectionProps,
  type DeleteProjectProps,
  type Entry,
  type ListAssetsProps,
  type ListCollectionsProps,
  type ListProjectsProps,
  type PaginatedList,
  type Project,
  type ReadAssetProps,
  type ReadCollectionProps,
  type ReadProjectProps,
  type SetRemoteOriginUrlProjectProps,
  type UpdateCollectionProps,
  type UpdateEntryProps,
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
    list: (props?: ListProjectsProps) =>
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
    synchronize: mutationOptions({
      mutationFn: window.ipc.core.projects.synchronize,
      meta: {
        method: 'synchronize',
        objectType: 'project',
      },
      onSuccess: async (_data, variables, _onMutateResult, context) => {
        // On synchronization anything inside the Project may have changed
        // so we invalidate it entirely
        await context.client.invalidateQueries({
          queryKey: ['projects', variables.id],
          refetchType: 'all',
        });
      },
    }),
    setRemoteOriginUrl: (props: SetRemoteOriginUrlProjectProps) =>
      mutationOptions({
        mutationFn: window.ipc.core.projects.setRemoteOriginUrl,
        meta: {
          method: 'update',
          objectType: 'project',
        },
        onSuccess: (updatedProject, variables, _onMutateResult, context) => {
          // Update Project in cache individually
          context.client.setQueryData(['projects', props.id], updatedProject);

          // And update the Projects list cache too
          context.client.setQueryData(
            ['projects'],
            (old: PaginatedList<Project>) => {
              return {
                total: old.total,
                limit: old.limit,
                offset: old.offset,
                list: old.list.map((oldProject) =>
                  oldProject.id === variables.id ? updatedProject : oldProject
                ),
              };
            }
          );
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
    create: mutationOptions({
      mutationFn: window.ipc.core.assets.create,
      meta: {
        method: 'create',
        objectType: 'asset',
      },
      onSuccess: (createdAsset, variables, _onMutateResult, context) => {
        // Add Asset to cache individually
        context.client.setQueryData(
          ['projects', variables.projectId, 'assets', createdAsset.id],
          createdAsset
        );

        // And update the Assets list cache too
        context.client.setQueryData(
          ['projects', variables.projectId, 'assets'],
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
    update: mutationOptions({
      mutationFn: window.ipc.core.assets.update,
      meta: {
        method: 'update',
        objectType: 'asset',
      },
      onSuccess: (updatedAsset, variables, _onMutateResult, context) => {
        // Update Asset in cache individually
        context.client.setQueryData(
          ['projects', variables.projectId, 'assets', updatedAsset.id],
          updatedAsset
        );

        // And update the Assets list cache too
        context.client.setQueryData(
          ['projects', variables.projectId, 'assets'],
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
    delete: mutationOptions({
      mutationFn: window.ipc.core.assets.delete,
      meta: {
        method: 'delete',
        objectType: 'asset',
      },
      onSuccess: (_deletedAsset, variables, _onMutateResult, context) => {
        // Remove Asset from cache individually
        context.client.setQueryData(
          ['projects', variables.projectId, 'assets', variables.id],
          undefined
        );

        // And update the Assets list cache too
        context.client.setQueryData(
          ['projects', variables.projectId, 'assets'],
          (old: PaginatedList<Asset>) => {
            return {
              total: old.total - 1,
              limit: old.limit,
              offset: old.offset,
              list: old.list.filter((oldAsset) => oldAsset.id !== variables.id),
            };
          }
        );
      },
    }),
    save: mutationOptions({
      mutationFn: window.ipc.core.assets.save,
      meta: {
        method: 'save',
        objectType: 'asset',
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
  entries: {
    create: (props: CreateEntryProps) =>
      mutationOptions({
        mutationFn: async () => {
          return await window.ipc.core.entries.create(props);
        },
        meta: {
          method: 'create',
          objectType: 'entry',
        },
        onSuccess: (createdEntry, _variables, _onMutateResult, context) => {
          // Add Entry to cache individually
          context.client.setQueryData(
            [
              'projects',
              props.projectId,
              'collections',
              props.collectionId,
              'entries',
              createdEntry.id,
            ],
            createdEntry
          );

          // And update the Entries list cache too
          context.client.setQueryData(
            [
              'projects',
              props.projectId,
              'collections',
              props.collectionId,
              'entries',
            ],
            (old: PaginatedList<Entry> | undefined) => {
              if (!old) return old;
              return {
                total: old.total + 1,
                limit: old.limit,
                offset: old.offset,
                list: [...old.list, createdEntry],
              };
            }
          );
        },
      }),
    read: (props: { projectId: string; collectionId: string; id: string }) =>
      queryOptions({
        queryKey: [
          'projects',
          props.projectId,
          'collections',
          props.collectionId,
          'entries',
          props.id,
        ],
        queryFn: async () => {
          return await window.ipc.core.entries.read(props);
        },
      }),
    update: (props: UpdateEntryProps) =>
      mutationOptions({
        mutationFn: async () => {
          return await window.ipc.core.entries.update(props);
        },
        meta: {
          method: 'update',
          objectType: 'entry',
        },
        onSuccess: (updatedEntry, _variables, _onMutateResult, context) => {
          // Update Entry in cache individually
          context.client.setQueryData(
            [
              'projects',
              props.projectId,
              'collections',
              props.collectionId,
              'entries',
              updatedEntry.id,
            ],
            updatedEntry
          );

          // And update the Entries list cache too
          context.client.setQueryData(
            [
              'projects',
              props.projectId,
              'collections',
              props.collectionId,
              'entries',
            ],
            (old: PaginatedList<Entry> | undefined) => {
              if (!old) return old;
              return {
                total: old.total,
                limit: old.limit,
                offset: old.offset,
                list: old.list.map((oldEntry) =>
                  oldEntry.id === updatedEntry.id ? updatedEntry : oldEntry
                ),
              };
            }
          );
        },
      }),
    delete: (props: { projectId: string; collectionId: string; id: string }) =>
      mutationOptions({
        mutationFn: async () => {
          return await window.ipc.core.entries.delete(props);
        },
        meta: {
          method: 'delete',
          objectType: 'entry',
        },
        onSuccess: (_deletedEntry, _variables, _onMutateResult, context) => {
          // Remove Entry from cache individually
          context.client.setQueryData(
            [
              'projects',
              props.projectId,
              'collections',
              props.collectionId,
              'entries',
              props.id,
            ],
            undefined
          );

          // And update the Entries list cache too
          context.client.setQueryData(
            [
              'projects',
              props.projectId,
              'collections',
              props.collectionId,
              'entries',
            ],
            (old: PaginatedList<Entry> | undefined) => {
              if (!old) return old;
              return {
                total: old.total - 1,
                limit: old.limit,
                offset: old.offset,
                list: old.list.filter((oldEntry) => oldEntry.id !== props.id),
              };
            }
          );
        },
      }),
    list: (props: {
      projectId: string;
      collectionId: string;
      limit: number;
      offset: number;
    }) =>
      queryOptions({
        queryKey: [
          'projects',
          props.projectId,
          'collections',
          props.collectionId,
          'entries',
        ],
        queryFn: async () => {
          const entries = await window.ipc.core.entries.list(props);

          // Cache each entry individually too
          // so that we can access them directly without refetching later
          entries.list.forEach((entry) => {
            queryClient.setQueryData(
              [
                'projects',
                props.projectId,
                'collections',
                props.collectionId,
                'entries',
                entry.id,
              ],
              entry
            );
          });

          return entries;
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
    set: mutationOptions({
      mutationFn: window.ipc.core.user.set,
      meta: {
        method: 'set',
        objectType: 'user',
      },
      onSuccess: (updatedUser, _variables, _onMutateResult, context) => {
        context.client.setQueryData(['user'], updatedUser);
      },
    }),
  },
  api: {
    isRunning: () =>
      queryOptions({
        queryKey: ['user', 'localApi', 'isRunning'],
        queryFn: async () => {
          return await window.ipc.core.api.isRunning();
        },
      }),
    start: mutationOptions({
      mutationFn: window.ipc.core.api.start,
      meta: {
        method: 'start',
        objectType: 'api',
      },
      onSuccess: (_data, _variables, _onMutateResult, context) => {
        context.client.setQueryData(['user', 'localApi', 'isRunning'], true);
      },
    }),
    stop: mutationOptions({
      mutationFn: window.ipc.core.api.stop,
      meta: {
        method: 'stop',
        objectType: 'api',
      },
      onSuccess: (_data, _variables, _onMutateResult, context) => {
        context.client.setQueryData(['user', 'localApi', 'isRunning'], false);
      },
    }),
  },
};
