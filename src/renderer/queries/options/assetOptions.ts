import { queryOptions } from '@tanstack/react-query';

import type {
  Asset,
  ListAssetsProps,
  PaginatedList,
  ReadAssetProps,
} from '@elek-io/core';

import { queryClient } from '../client';
import { customMutationOptions, mergeListWithObject } from '../util';

export const assetOptions = {
  create: customMutationOptions({
    mutationFn: window.ipc.core.assets.create,
    meta: {
      method: 'create',
      objectType: 'asset',
    },
    onSuccess: (createdAsset, variables, _result, context) => {
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
  update: customMutationOptions({
    mutationFn: window.ipc.core.assets.update,
    meta: {
      method: 'update',
      objectType: 'asset',
    },
    onSuccess: (updatedAsset, variables, _result, context) => {
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
  delete: customMutationOptions({
    mutationFn: window.ipc.core.assets.delete,
    meta: {
      method: 'delete',
      objectType: 'asset',
    },
    onSuccess: (_deletedAsset, variables, _result, context) => {
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
          mergeListWithObject(oldList, { id: variables.id } as Asset, 'delete')
      );
    },
  }),
  save: customMutationOptions({
    mutationFn: window.ipc.core.assets.save,
    meta: {
      method: 'save',
      objectType: 'asset',
    },
    onSuccess: async (_data, variables, _result, context) => {
      // Invalidate asset queries to refetch updated data
      await context.client.invalidateQueries({
        queryKey: ['projects', variables.projectId, 'current', 'assets'],
      });
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
};
