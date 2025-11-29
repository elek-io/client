import { mutationOptions, queryOptions } from '@tanstack/react-query';

import {
  type Asset,
  type Collection,
  type Entry,
  type ListAssetsProps,
  type ListCollectionsProps,
  type ListEntriesProps,
  type ListProjectsProps,
  type PaginatedList,
  type Project,
  type ReadAssetProps,
  type ReadCollectionProps,
  type ReadEntryProps,
  type ReadProjectProps,
} from '@elek-io/core';

import { queryClient } from './client';

/**
 * Query and Mutation options for Tanstack Query that wrap IPC calls to the main process.
 */
export default {
  projects: {
    create: mutationOptions({
      mutationFn: window.ipc.core.projects.create,
      throwOnError: true,
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
          (old: PaginatedList<Project> | undefined) => {
            return {
              total: old ? old.total + 1 : 1,
              limit: old ? old.limit : 0,
              offset: old ? old.offset : 0,
              list: [...(old ? old.list : []), createdProject],
            };
          }
        );
      },
    }),
    read: (props: ReadProjectProps) =>
      queryOptions({
        queryKey: [
          'projects',
          props.id,
          props.commitHash ? props.commitHash : undefined,
        ],
        queryFn: async () => {
          return await window.ipc.core.projects.read(props);
        },
        throwOnError: true,
      }),
    update: mutationOptions({
      mutationFn: window.ipc.core.projects.update,
      throwOnError: true,
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
    delete: mutationOptions({
      mutationFn: window.ipc.core.projects.delete,
      throwOnError: true,
      meta: {
        method: 'delete',
        objectType: 'project',
      },
      onSuccess: (_deletedProject, variables, _onMutateResult, context) => {
        // Remove Project from cache individually
        context.client.setQueryData(['projects', variables.id], undefined);

        // And update the Projects list cache too
        context.client.setQueryData(
          ['projects'],
          (old: PaginatedList<Project>) => {
            return {
              total: old.total - 1,
              limit: old.limit,
              offset: old.offset,
              list: old.list.filter(
                (oldProject) => oldProject.id !== variables.id
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
        throwOnError: true,
      }),
    clone: mutationOptions({
      mutationFn: window.ipc.core.projects.clone,
      throwOnError: true,
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
          (old: PaginatedList<Project> | undefined) => {
            return {
              total: old ? old.total + 1 : 1,
              limit: old ? old.limit : 0,
              offset: old ? old.offset : 0,
              list: [...(old ? old.list : []), clonedProject],
            };
          }
        );
      },
    }),
    getChanges: (projectId: string, project?: Project) =>
      queryOptions({
        enabled: project !== undefined && project.remoteOriginUrl !== null,
        queryKey: ['projects', projectId, 'changes'],
        queryFn: async () => {
          return await window.ipc.core.projects.getChanges({
            id: projectId,
          });
        },
        throwOnError: true,
        // Refetch the data every 3 minutes
        refetchInterval: 180000,
      }),
    synchronize: mutationOptions({
      mutationFn: window.ipc.core.projects.synchronize,
      throwOnError: true,
      meta: {
        method: 'synchronize',
        objectType: 'project',
      },
      onSuccess: async (_data, variables, _onMutateResult, context) => {
        // On synchronization anything inside the Project may have changed
        // so we invalidate it entirely
        await context.client.invalidateQueries({
          queryKey: ['projects'],
          refetchType: 'all',
        });
      },
    }),
    setRemoteOriginUrl: mutationOptions({
      mutationFn: window.ipc.core.projects.setRemoteOriginUrl,
      throwOnError: true,
      meta: {
        method: 'update',
        objectType: 'project',
      },
      onSuccess: async (_data, _variables, _onMutateResult, context) => {
        // Remote origin URL is part of the Project data
        // so we invalidate it entirely
        await context.client.invalidateQueries({
          queryKey: ['projects'],
          refetchType: 'all',
        });
      },
    }),
  },
  collections: {
    create: mutationOptions({
      mutationFn: window.ipc.core.collections.create,
      throwOnError: true,
      meta: {
        method: 'create',
        objectType: 'collection',
      },
      onSuccess: (createdCollection, variables, _onMutateResult, context) => {
        // Add Collection to cache individually
        context.client.setQueryData(
          [
            'projects',
            variables.projectId,
            'collections',
            createdCollection.id,
          ],
          createdCollection
        );

        // And update the Collections list cache too
        context.client.setQueryData(
          ['projects', variables.projectId, 'collections'],
          (old: PaginatedList<Collection> | undefined) => {
            return {
              total: old ? old.total + 1 : 1,
              limit: old ? old.limit : 0,
              offset: old ? old.offset : 0,
              list: [...(old ? old.list : []), createdCollection],
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
        throwOnError: true,
      }),
    update: mutationOptions({
      mutationFn: window.ipc.core.collections.update,
      throwOnError: true,
      meta: {
        method: 'update',
        objectType: 'collection',
      },
      onSuccess: (updatedCollection, variables, _onMutateResult, context) => {
        // Update Collection in cache individually
        context.client.setQueryData(
          [
            'projects',
            variables.projectId,
            'collections',
            updatedCollection.id,
          ],
          updatedCollection
        );

        // And update the Collections list cache too
        context.client.setQueryData(
          ['projects', variables.projectId, 'collections'],
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
    delete: mutationOptions({
      mutationFn: window.ipc.core.collections.delete,
      throwOnError: true,
      meta: {
        method: 'delete',
        objectType: 'collection',
      },
      onSuccess: (_deletedCollection, variables, _onMutateResult, context) => {
        // Remove Collection from cache individually
        context.client.setQueryData(
          ['projects', variables.projectId, 'collections', variables.id],
          undefined
        );

        // And update the Collections list cache too
        context.client.setQueryData(
          ['projects', variables.projectId, 'collections'],
          (old: PaginatedList<Collection>) => {
            return {
              total: old.total - 1,
              limit: old.limit,
              offset: old.offset,
              list: old.list.filter(
                (oldCollection) => oldCollection.id !== variables.id
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
        throwOnError: true,
      }),
  },
  assets: {
    create: mutationOptions({
      mutationFn: window.ipc.core.assets.create,
      throwOnError: true,
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
          (old: PaginatedList<Asset> | undefined) => {
            return {
              total: old ? old.total + 1 : 1,
              limit: old ? old.limit : 0,
              offset: old ? old.offset : 0,
              list: [...(old ? old.list : []), createdAsset],
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
        throwOnError: true,
      }),
    update: mutationOptions({
      mutationFn: window.ipc.core.assets.update,
      throwOnError: true,
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
      throwOnError: true,
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
      throwOnError: true,
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
        throwOnError: true,
      }),
  },
  entries: {
    create: mutationOptions({
      mutationFn: window.ipc.core.entries.create,
      throwOnError: true,
      meta: {
        method: 'create',
        objectType: 'entry',
      },
      onSuccess: (createdEntry, variables, _onMutateResult, context) => {
        // Add Entry to cache individually
        context.client.setQueryData(
          [
            'projects',
            variables.projectId,
            'collections',
            variables.collectionId,
            'entries',
            createdEntry.id,
          ],
          createdEntry
        );

        // And update the Entries list cache too
        context.client.setQueryData(
          [
            'projects',
            variables.projectId,
            'collections',
            variables.collectionId,
            'entries',
          ],
          (old: PaginatedList<Entry> | undefined) => {
            return {
              total: old ? old.total + 1 : 1,
              limit: old ? old.limit : 0,
              offset: old ? old.offset : 0,
              list: [...(old ? old.list : []), createdEntry],
            };
          }
        );
      },
    }),
    read: (props: ReadEntryProps) =>
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
        throwOnError: true,
      }),
    update: mutationOptions({
      mutationFn: window.ipc.core.entries.update,
      throwOnError: true,
      meta: {
        method: 'update',
        objectType: 'entry',
      },
      onSuccess: (updatedEntry, variables, _onMutateResult, context) => {
        // Update Entry in cache individually
        context.client.setQueryData(
          [
            'projects',
            variables.projectId,
            'collections',
            variables.collectionId,
            'entries',
            updatedEntry.id,
          ],
          updatedEntry
        );

        // And update the Entries list cache too
        context.client.setQueryData(
          [
            'projects',
            variables.projectId,
            'collections',
            variables.collectionId,
            'entries',
          ],
          (old: PaginatedList<Entry>) => {
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
    delete: mutationOptions({
      mutationFn: window.ipc.core.entries.delete,
      throwOnError: true,
      meta: {
        method: 'delete',
        objectType: 'entry',
      },
      onSuccess: (_deletedEntry, variables, _onMutateResult, context) => {
        // Remove Entry from cache individually
        context.client.setQueryData(
          [
            'projects',
            variables.projectId,
            'collections',
            variables.collectionId,
            'entries',
            variables.id,
          ],
          undefined
        );

        // And update the Entries list cache too
        context.client.setQueryData(
          [
            'projects',
            variables.projectId,
            'collections',
            variables.collectionId,
            'entries',
          ],
          (old: PaginatedList<Entry>) => {
            return {
              total: old.total - 1,
              limit: old.limit,
              offset: old.offset,
              list: old.list.filter((oldEntry) => oldEntry.id !== variables.id),
            };
          }
        );
      },
    }),
    list: (props: ListEntriesProps) =>
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
        throwOnError: true,
      }),
  },
  user: {
    get: () =>
      queryOptions({
        queryKey: ['user'],
        queryFn: async () => {
          return await window.ipc.core.user.get();
        },
        throwOnError: true,
      }),
    set: mutationOptions({
      mutationFn: window.ipc.core.user.set,
      throwOnError: true,
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
        throwOnError: true,
      }),
    start: mutationOptions({
      mutationFn: window.ipc.core.api.start,
      throwOnError: true,
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
      throwOnError: true,
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
