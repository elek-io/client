import { Asset } from '@elek-io/core';
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
import { AssetDisplay } from '@renderer/components/ui/asset-display';
import { AssetTeaser } from '@renderer/components/ui/asset-teaser';
import { Button } from '@renderer/components/ui/button';
import { Page } from '@renderer/components/ui/page';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { NotificationIntent, useStore } from '@renderer/store';
import { formatBytes, formatDatetime } from '@renderer/util';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Plus, Save, Trash } from 'lucide-react';
import { ReactElement, useState } from 'react';

export const Route = createFileRoute('/projects/$projectId/assets/')({
  beforeLoad: async ({ context, params }) => {
    const currentAssets = await context.core.assets.list({
      projectId: params.projectId,
    });
    // Change path to use custom protocoll
    currentAssets.list = currentAssets.list.map((asset) => {
      return {
        ...asset,
        absolutePath: 'elek-io-local-file://' + asset.absolutePath,
      };
    });

    return { currentAssets };
  },
  component: ProjectAssetsPage,
});

function ProjectAssetsPage(): JSX.Element {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = useStore((state) => state.addNotification);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const createdTime = formatDatetime(selectedAsset?.created, 'en');
  const updatedTime = formatDatetime(selectedAsset?.updated, 'en');
  const information = [
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
    {
      key: 'Type',
      value: selectedAsset?.extension.toUpperCase(),
      tooltip: selectedAsset?.mimeType,
    },
  ];

  function Description(): ReactElement {
    return (
      <>
        An Asset is a file like an image, PDF or other document that can be used
        inside your Collections.
      </>
    );
  }

  function Actions(): ReactElement {
    return (
      <>
        <Button variant="default" onClick={() => onAddAssets()}>
          <Plus className="w-4 h-4 mr-2"></Plus>
          Add Assets
        </Button>
      </>
    );
  }

  async function onAddAssets(): Promise<void> {
    try {
      const result = await context.electron.dialog.showOpenDialog({
        title: 'Select Assets to add',
        buttonLabel: 'Add to Assets',
        properties: ['openFile', 'multiSelections'],
      });

      if (result.canceled === true) {
        return;
      }

      await createAssetsFromPaths(result.filePaths);
      router.invalidate();
    } catch (error) {
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to open dialog',
        description: 'There was an error showing the file select dialog.',
      });
    }
  }

  async function onAssetSave(): Promise<void> {
    if (!selectedAsset) {
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to save Asset',
        description: 'No Asset selected to save.',
      });
      return;
    }

    try {
      const result = await context.electron.dialog.showSaveDialog({
        // title: `Save Asset ${selectedAsset.name}.${selectedAsset.extension} to disk`,
        // buttonLabel: 'Save Asset',
        // message: 'Hello World!',
        defaultPath: `*/${selectedAsset.name}.${selectedAsset.extension}`,
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

      await context.core.assets.save({
        projectId: context.project.id,
        id: selectedAsset.id,
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
    if (!selectedAsset) {
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to delete Asset',
        description: 'No Asset selected to delete.',
      });
      return;
    }

    try {
      await context.core.assets.delete({
        ...selectedAsset,
        projectId: context.project.id,
      });
      addNotification({
        intent: NotificationIntent.SUCCESS,
        title: 'Successfully deleted Asset',
        description: 'The Asset was deleted successfully.',
      });
      setSelectedAsset(null);
      router.invalidate();
    } catch (error) {
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to delete Asset',
        description: 'There was an error deleting the Asset from disk.',
      });
    }
  }

  async function createAssetsFromPaths(paths: string[]): Promise<void> {
    const assetPromisses: Promise<Asset>[] = [];

    for (const path of paths) {
      assetPromisses.push(
        context.core.assets.create({
          name: path.split('/').pop() || '',
          description: '',
          projectId: context.project.id,
          filePath: path,
        })
      );
    }

    const results = await Promise.all(assetPromisses);
    console.log('Asset create results: ', results);
  }

  function onDragOver(event: React.DragEvent<HTMLElement>): void {
    event.preventDefault();
    event.stopPropagation();
    console.log('onDragOver');
  }

  function onDragEnter(event: React.DragEvent<HTMLElement>): void {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(true);
    console.log('onDragEnter');
  }

  function onDragLeave(event: React.DragEvent<HTMLElement>): void {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
    console.log('onDragLeave');
  }

  /**
   * @todo This creates one commit for all instead on one per uploaded file, how is this possible?
   */
  async function onAssetsDropped(
    event: React.DragEvent<HTMLElement>
  ): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    console.log('Dropped: ', event);

    const paths = [...event.dataTransfer.items].map((item) => {
      const file = item.getAsFile();
      if (file) {
        return file.path;
      }
      return '';
    });
    await createAssetsFromPaths(paths);
    Route.update({});
  }

  return (
    <Page
      title="Assets"
      description={<Description></Description>}
      actions={<Actions></Actions>}
      layout="bare"
      className={isDraggingOver ? 'ring-4 ring-inset border-brand-600' : ''}
      onDragOver={onDragOver}
      onDrop={onAssetsDropped}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
    >
      <div className="flex">
        <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-5 xl:gap-6">
            {isDraggingOver ? 'dragging' : 'not dragging'}
            {context.currentAssets.list.map((asset) => (
              <AssetTeaser
                key={asset.id}
                {...asset}
                onClick={() => setSelectedAsset(asset)}
              ></AssetTeaser>
            ))}
          </div>
        </div>
        <div className="w-72 flex-shrink-0 ml-8">
          {selectedAsset && (
            <>
              <div className="aspect-4/3 flex items-center justify-center">
                <AssetDisplay {...selectedAsset} preview={true}></AssetDisplay>
              </div>
              <div className="mt-4 text-sm flex flex-col items-start justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-4">
                <div>
                  <h2 className="text-lg break-all">{selectedAsset.name}</h2>
                  <p>{formatBytes(selectedAsset.size)}</p>
                </div>
                <div className="mt-4 w-full">
                  <h3>Information</h3>
                  <dl className="mt-2 divide-y divide-zinc-200 dark:divide-zinc-800 border-t border-b border-zinc-200 dark:border-zinc-800">
                    {information.map((info) => {
                      return (
                        <div
                          key={info.key}
                          className="flex justify-between py-3"
                        >
                          <dt className="">{info.key}</dt>
                          <dd className="whitespace-nowrap">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>{info.value}</TooltipTrigger>
                                <TooltipContent side="top" align="center">
                                  <p>{info.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
                <div>
                  <h3 className="text-gray-900">Description</h3>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="italic text-gray-500">
                      {selectedAsset.description}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button variant="secondary" onClick={onAssetSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
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
                          This action can be undone later by restoring the Asset
                          via it's history.
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
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Page>
  );
}
