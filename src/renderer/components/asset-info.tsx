import { useMutation } from '@tanstack/react-query';
import { Download, Edit2, Trash } from 'lucide-react';
import type { ReactElement } from 'react';

import { AssetDisplay } from '@renderer/components/asset-display';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@renderer/components/ui/alert-dialog';
import { Button } from '@renderer/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { formatBytes } from '@renderer/lib/utils';
import queryOptions from '@renderer/queries/options';
import { useStore } from '@renderer/store';

import { type Asset, type SupportedLanguage } from '@elek-io/core';

export interface AssetInfoProps {
  projectId: string;
  asset: Asset;
  language: SupportedLanguage;
  showUpdateButton?: boolean;
  showDeleteButton?: boolean;
  onAssetUpdated?: () => void;
  onAssetDeleted?: () => void;
}

export function AssetInfo({
  projectId,
  asset,
  language,
  showUpdateButton,
  showDeleteButton,
  onAssetUpdated,
  onAssetDeleted,
}: AssetInfoProps): ReactElement {
  const addNotification = useStore((state) => state.addNotification);
  const createdTime = formatDatetime(asset.created, language);
  const updatedTime = formatDatetime(asset.updated, language);
  const information = [
    {
      key: 'Size',
      value: formatBytes(asset.size),
    },
    {
      key: 'Type',
      value: asset.extension.toUpperCase(),
      tooltip: asset.mimeType,
    },
    {
      key: 'Created',
      value: createdTime.relative,
      tooltip: createdTime.absolute,
    },
    {
      key: 'Updated',
      value: updatedTime.relative,
      tooltip: updatedTime.absolute,
    },
  ];

  async function onAssetUpdate(): Promise<void> {
    try {
      const result = await window.ipc.electron.dialog.showOpenDialog({
        title: 'Select Asset to update with',
        buttonLabel: 'Update Asset',
        properties: ['openFile'],
      });

      if (result.canceled === true) {
        return;
      }

      const updateAssetMutation = useMutation(
        queryOptions.assets.update({
          projectId: projectId,
          id: asset.id,
          newFilePath: result.filePaths[0],
          name: 'Updated Asset',
          description: 'Updated Asset',
        })
      );
      await updateAssetMutation.mutateAsync();
      addNotification({
        intent: 'success',
        title: 'Successfully updated Asset',
        description: 'The Asset was updated successfully.',
      });
      if (onAssetUpdated) {
        onAssetUpdated();
      }
    } catch (error) {
      await ipc.core.logger.error({
        source: 'desktop',
        message: 'Failed to update Asset',
        meta: { error },
      });
      addNotification({
        intent: 'danger',
        title: 'Failed to update Asset',
        description: 'There was an error updating the Asset to disk.',
      });
    }
  }

  async function onAssetSave(): Promise<void> {
    try {
      const result = await window.ipc.electron.dialog.showSaveDialog({
        // title: `Save Asset ${asset.name}.${asset.extension} to disk`,
        // buttonLabel: 'Save Asset',
        // message: 'Hello World!',
        defaultPath: `*/${asset.name}.${asset.extension}`,
        // properties: ['createDirectory', 'showOverwriteConfirmation'],
        // filters: [
        //   {
        //     name: 'Supported files',
        //     extensions: [...supportedAssetExtensionSchema.options],
        //   },
        // ],
      });

      if (result.canceled === true) {
        return;
      }

      await ipc.core.assets.save({
        projectId: projectId,
        id: asset.id,
        filePath: result.filePath,
      });
      addNotification({
        intent: 'success',
        title: 'Successfully saved Asset',
        description: 'The Asset was saved successfully.',
      });
    } catch (error) {
      await ipc.core.logger.error({
        source: 'desktop',
        message: 'Failed to save Asset',
        meta: { error },
      });
      addNotification({
        intent: 'danger',
        title: 'Failed to save Asset',
        description: 'There was an error saving the Asset to disk.',
      });
    }
  }

  async function onAssetDelete(): Promise<void> {
    try {
      await ipc.core.assets.delete({
        ...asset,
        projectId: projectId,
      });
      addNotification({
        intent: 'success',
        title: 'Successfully deleted Asset',
        description: 'The Asset was deleted successfully.',
      });
      if (onAssetDeleted) {
        onAssetDeleted();
      }
    } catch (error) {
      await ipc.core.logger.error({
        source: 'desktop',
        message: 'Failed to delete Asset',
        meta: { error },
      });
      addNotification({
        intent: 'danger',
        title: 'Failed to delete Asset',
        description: 'There was an error deleting the Asset from disk.',
      });
    }
  }

  return (
    <>
      <div className="w-full p-2 pb-0">
        <div className="flex aspect-4/3 items-center justify-center">
          <AssetDisplay {...asset} static={false} />
        </div>
      </div>
      <div className="p-6">
        <h2 className="text-lg break-all">{asset.name}</h2>
        <p className="text-zinc-400">{asset.description}</p>
      </div>
      <div className="w-full">
        <dl className="divide-y divide-zinc-200 border-t border-b border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {information.map((info) => {
            return (
              <div key={info.key} className="flex justify-between px-6 py-2">
                <dt className="">{info.key}</dt>
                <dd className="whitespace-nowrap">
                  {info.tooltip !== undefined ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>{info.value}</TooltipTrigger>
                        <TooltipContent side="top" align="center">
                          <p>{info.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    info.value
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
      <div className="flex w-full flex-col gap-2 p-4">
        {showUpdateButton === true ? (
          <Button
            variant="outline"
            className=""
            Icon={Edit2}
            onClick={onAssetUpdate}
          >
            Update
          </Button>
        ) : null}

        <Button variant="outline" Icon={Download} onClick={onAssetSave}>
          Save as
        </Button>

        {showDeleteButton === true ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" Icon={Trash}>
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  You are about to delete this Asset
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action can be undone later by restoring the Asset via
                  it&apos;s history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    variant="destructive"
                    Icon={Trash}
                    onClick={onAssetDelete}
                  >
                    Delete
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>
    </>
  );
}
