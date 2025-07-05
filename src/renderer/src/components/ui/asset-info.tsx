import { type Asset, type SupportedLanguage } from '@elek-io/core';
import { ipc } from '@renderer/ipc';
import { NotificationIntent, useStore } from '@renderer/store';
import { Download, Edit2, Trash } from 'lucide-react';
import { formatBytes, formatDatetime } from '../../util';
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
} from './alert-dialog';
import { AssetDisplay } from './asset-display';
import { Button } from './button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

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
}: AssetInfoProps): JSX.Element {
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
      const result = await ipc.electron.dialog.showOpenDialog({
        title: 'Select Asset to update with',
        buttonLabel: 'Update Asset',
        properties: ['openFile'],
      });

      if (result.canceled === true) {
        return;
      }

      await ipc.core.assets.update({
        projectId: projectId,
        id: asset.id,
        newFilePath: result.filePaths[0],
        name: 'Updated Asset',
        description: 'Updated Asset',
      });
      addNotification({
        intent: NotificationIntent.SUCCESS,
        title: 'Successfully updated Asset',
        description: 'The Asset was updated successfully.',
      });
      if (onAssetUpdated) {
        onAssetUpdated();
      }
    } catch (error) {
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to update Asset',
        description: 'There was an error updating the Asset to disk.',
      });
    }
  }

  async function onAssetSave(): Promise<void> {
    if (!asset) {
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to save Asset',
        description: 'No Asset selected to save.',
      });
      return;
    }

    try {
      const result = await ipc.electron.dialog.showSaveDialog({
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
        intent: NotificationIntent.SUCCESS,
        title: 'Successfully saved Asset',
        description: 'The Asset was saved successfully.',
      });
    } catch (error) {
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to save Asset',
        description: 'There was an error saving the Asset to disk.',
      });
    }
  }

  async function onAssetDelete(): Promise<void> {
    if (!asset) {
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to delete Asset',
        description: 'No Asset selected to delete.',
      });
      return;
    }

    try {
      await ipc.core.assets.delete({
        ...asset,
        projectId: projectId,
      });
      addNotification({
        intent: NotificationIntent.SUCCESS,
        title: 'Successfully deleted Asset',
        description: 'The Asset was deleted successfully.',
      });
      if (onAssetDeleted) {
        onAssetDeleted();
      }
    } catch (error) {
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to delete Asset',
        description: 'There was an error deleting the Asset from disk.',
      });
    }
  }

  return (
    <>
      <div className="p-2 pb-0 w-full">
        <div className="aspect-4/3 flex items-center justify-center">
          <AssetDisplay {...asset} static={false}></AssetDisplay>
        </div>
      </div>
      <div className="p-6">
        <h2 className="text-lg break-all">{asset.name}</h2>
        <p className="text-zinc-400">{asset.description}</p>
      </div>
      <div className="w-full">
        <dl className="divide-y divide-zinc-200 dark:divide-zinc-800 border-t border-b border-zinc-200 dark:border-zinc-800">
          {information.map((info) => {
            return (
              <div key={info.key} className="flex justify-between py-2 px-6">
                <dt className="">{info.key}</dt>
                <dd className="whitespace-nowrap">
                  {info.tooltip && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>{info.value}</TooltipTrigger>
                        <TooltipContent side="top" align="center">
                          <p>{info.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {!info.tooltip && info.value}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
      <div className="flex flex-col p-4 w-full gap-2">
        {showUpdateButton && (
          <Button variant="outline" className="" onClick={onAssetUpdate}>
            <Edit2 className="w-4 h-4 mr-2" />
            Update
          </Button>
        )}

        <Button variant="outline" onClick={onAssetSave}>
          <Download className="w-4 h-4 mr-2" />
          Save as
        </Button>

        {showDeleteButton && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="w-4 h-4 mr-2"></Trash>
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
                  it's history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onAssetDelete}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </>
  );
}
