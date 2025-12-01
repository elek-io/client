import { mutationOptions, queryOptions } from '@tanstack/react-query';

import {
  type Asset,
  type BaseFile,
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
 * Helper function to merge an object into a paginated list.
 *
 * Used in mutation onSuccess handlers to update list caches when
 * an individual object is created or updated.
 */
function mergeListWithObject<T extends BaseFile>(
  oldList: PaginatedList<T> | undefined,
  object: T,
  method?: 'update' | 'delete'
): PaginatedList<T> {
  if (!oldList) {
    // No list exists yet, create a new one with just the object
    return {
      total: 1,
      limit: 0,
      offset: 0,
      list: [object],
    };
  }

  if (oldList.list.find((oldObject) => oldObject.id === object.id)) {
    if (method === undefined) {
      throw new Error(
        'mergeListWithObject: method must be provided when object exists in the list'
      );
    }

    if (method === 'update') {
      // Object exists in the list, update it
      return {
        ...oldList,
        list: oldList.list.map((oldObject) => {
          if (oldObject.id === object.id) {
            return object;
          }
          return oldObject;
        }),
      };
    } else {
      // Object exists in the list, remove it
      return {
        total: oldList.total - 1,
        limit: oldList.limit,
        offset: oldList.offset,
        list: oldList.list.filter((oldObject) => oldObject.id !== object.id),
      };
    }
  } else {
    // Object does not exist in the list, add it
    return {
      total: oldList.total + 1,
      limit: oldList.limit,
      offset: oldList.offset,
      list: [...oldList.list, object],
    };
  }
}

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
          ['projects', createdProject.id, 'current'],
          createdProject
        );

        // And update the Projects list cache too
        context.client.setQueryData<PaginatedList<Project>>(
          ['projects', 'list'],
          (oldList) => mergeListWithObject(oldList, createdProject)
        );
      },
    }),
    read: (props: ReadProjectProps) =>
      queryOptions({
        queryKey: [
          'projects',
          props.id,
          props.commitHash === undefined ? 'current' : props.commitHash,
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
          ['projects', updatedProject.id, 'current'],
          updatedProject
        );

        // And update the Projects list cache too
        context.client.setQueryData<PaginatedList<Project>>(
          ['projects', 'list'],
          (oldList) => mergeListWithObject(oldList, updatedProject, 'update')
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
        context.client.setQueryData(
          ['projects', variables.id, 'current'],
          undefined
        );

        // And update the Projects list cache too
        context.client.setQueryData<PaginatedList<Project>>(
          ['projects', 'list'],
          (oldList) =>
            mergeListWithObject(
              oldList,
              { id: variables.id } as Project,
              'delete'
            )
        );
      },
    }),
    list: (props?: ListProjectsProps) =>
      queryOptions({
        queryKey: ['projects', 'list'],
        queryFn: async () => {
          const projects = await window.ipc.core.projects.list(props);

          // Cache each project individually too
          // so that we can access them directly without refetching later
          projects.list.forEach((project) => {
            queryClient.setQueryData(
              ['projects', project.id, 'current'],
              project
            );
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
          ['projects', clonedProject.id, 'current'],
          clonedProject
        );

        // And update the Projects list cache too
        context.client.setQueryData<PaginatedList<Project>>(
          ['projects', 'list'],
          (oldList) => mergeListWithObject(oldList, clonedProject)
        );
      },
    }),
    getChanges: (project?: Project) =>
      queryOptions({
        enabled: project !== undefined && project.remoteOriginUrl !== null,
        queryKey: ['projects', project?.id, 'current', 'changes'],
        queryFn: async () => {
          return await window.ipc.core.projects.getChanges({
            id: project!.id,
          });
        },
        throwOnError: true,
        refetchInterval: 180000, // Refetch changes every 3 minutes
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
          queryKey: ['projects', 'list'],
          refetchType: 'all',
        });
        await context.client.invalidateQueries({
          queryKey: ['projects', variables.id],
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
      onSuccess: async (_data, variables, _onMutateResult, context) => {
        // Remote origin URL is part of the Project data
        // so we invalidate it entirely
        await context.client.invalidateQueries({
          queryKey: ['projects', 'list'],
          refetchType: 'all',
        });
        await context.client.invalidateQueries({
          queryKey: ['projects', variables.id],
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
            'current',
            'collections',
            createdCollection.id,
            'current',
          ],
          createdCollection
        );

        // And update the Collections list cache too
        context.client.setQueryData<PaginatedList<Collection>>(
          ['projects', variables.projectId, 'current', 'collections', 'list'],
          (oldList) => mergeListWithObject(oldList, createdCollection)
        );
      },
    }),
    read: (props: ReadCollectionProps) =>
      queryOptions({
        queryKey: [
          'projects',
          props.projectId,
          'current',
          'collections',
          props.id,
          props.commitHash === undefined ? 'current' : props.commitHash,
        ],
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
            'current',
            'collections',
            updatedCollection.id,
            'current',
          ],
          updatedCollection
        );

        // And update the Collections list cache too
        context.client.setQueryData<PaginatedList<Collection>>(
          ['projects', variables.projectId, 'current', 'collections', 'list'],
          (oldList) => mergeListWithObject(oldList, updatedCollection, 'update')
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
          [
            'projects',
            variables.projectId,
            'current',
            'collections',
            variables.id,
            'current',
          ],
          undefined
        );

        // And update the Collections list cache too
        context.client.setQueryData<PaginatedList<Collection>>(
          ['projects', variables.projectId, 'current', 'collections', 'list'],
          (oldList) =>
            mergeListWithObject(
              oldList,
              { id: variables.id } as Collection,
              'delete'
            )
        );
      },
    }),
    list: (props: ListCollectionsProps) =>
      queryOptions({
        queryKey: [
          'projects',
          props.projectId,
          'current',
          'collections',
          'list',
        ],
        queryFn: async () => {
          const collections = await window.ipc.core.collections.list(props);

          // Cache each collection individually too
          // so that we can access them directly without refetching later
          collections.list.forEach((collection) => {
            queryClient.setQueryData(
              [
                'projects',
                props.projectId,
                'current',
                'collections',
                collection.id,
                'current',
              ],
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
          [
            'projects',
            variables.projectId,
            'current',
            'assets',
            createdAsset.id,
            'current',
          ],
          createdAsset
        );

        // And update the Assets list cache too
        context.client.setQueryData<PaginatedList<Asset>>(
          ['projects', variables.projectId, 'current', 'assets', 'list'],
          (oldList) => mergeListWithObject(oldList, createdAsset)
        );
      },
    }),
    read: (props: ReadAssetProps) =>
      queryOptions({
        queryKey: [
          'projects',
          props.projectId,
          'current',
          'assets',
          props.id,
          props.commitHash === undefined ? 'current' : props.commitHash,
        ],
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
          [
            'projects',
            variables.projectId,
            'current',
            'assets',
            updatedAsset.id,
            'current',
          ],
          updatedAsset
        );

        // And update the Assets list cache too
        context.client.setQueryData<PaginatedList<Asset>>(
          ['projects', variables.projectId, 'current', 'assets', 'list'],
          (oldList) => mergeListWithObject(oldList, updatedAsset, 'update')
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
          [
            'projects',
            variables.projectId,
            'current',
            'assets',
            variables.id,
            'current',
          ],
          undefined
        );

        // And update the Assets list cache too
        context.client.setQueryData<PaginatedList<Asset>>(
          ['projects', variables.projectId, 'current', 'assets', 'list'],
          (oldList) =>
            mergeListWithObject(
              oldList,
              { id: variables.id } as Asset,
              'delete'
            )
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
        queryKey: ['projects', props.projectId, 'current', 'assets', 'list'],
        queryFn: async () => {
          const assets = await window.ipc.core.assets.list(props);

          // Cache each asset individually too
          // so that we can access them directly without refetching later
          assets.list.forEach((asset) => {
            queryClient.setQueryData(
              [
                'projects',
                props.projectId,
                'current',
                'assets',
                asset.id,
                'current',
              ],
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
            'current',
            'collections',
            variables.collectionId,
            'current',
            'entries',
            createdEntry.id,
            'current',
          ],
          createdEntry
        );

        // And update the Entries list cache too
        context.client.setQueryData<PaginatedList<Entry>>(
          [
            'projects',
            variables.projectId,
            'current',
            'collections',
            variables.collectionId,
            'current',
            'entries',
            'list',
          ],
          (oldList) => mergeListWithObject(oldList, createdEntry)
        );
      },
    }),
    read: (props: ReadEntryProps) =>
      queryOptions({
        queryKey: [
          'projects',
          props.projectId,
          'current',
          'collections',
          props.collectionId,
          'current',
          'entries',
          props.id,
          props.commitHash === undefined ? 'current' : props.commitHash,
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
            'current',
            'collections',
            variables.collectionId,
            'current',
            'entries',
            updatedEntry.id,
            'current',
          ],
          updatedEntry
        );

        // And update the Entries list cache too
        context.client.setQueryData<PaginatedList<Entry>>(
          [
            'projects',
            variables.projectId,
            'current',
            'collections',
            variables.collectionId,
            'current',
            'entries',
            'list',
          ],
          (oldList) => mergeListWithObject(oldList, updatedEntry, 'update')
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
            'current',
            'collections',
            variables.collectionId,
            'current',
            'entries',
            variables.id,
            'current',
          ],
          undefined
        );

        // And update the Entries list cache too
        context.client.setQueryData<PaginatedList<Entry>>(
          [
            'projects',
            variables.projectId,
            'current',
            'collections',
            variables.collectionId,
            'current',
            'entries',
            'list',
          ],
          (oldList) =>
            mergeListWithObject(
              oldList,
              { id: variables.id } as Entry,
              'delete'
            )
        );
      },
    }),
    list: (props: ListEntriesProps) =>
      queryOptions({
        queryKey: [
          'projects',
          props.projectId,
          'current',
          'collections',
          props.collectionId,
          'current',
          'entries',
          'list',
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
                'current',
                'collections',
                props.collectionId,
                'current',
                'entries',
                entry.id,
                'current',
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
