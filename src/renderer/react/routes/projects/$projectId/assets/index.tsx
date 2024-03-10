import { AssetDisplay } from '@/renderer/react/components/ui/asset-display';
import { Asset, supportedExtensionSchema } from '@elek-io/shared';
import { NotificationIntent, formatBytes, formatTimestamp } from '@elek-io/ui';
import { FilePlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { ReactElement, useState } from 'react';
import { AssetTeaser } from '../../../../components/ui/asset-teaser';
import { Button } from '../../../../components/ui/button';
import { Page } from '../../../../components/ui/page';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../components/ui/tooltip';

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

function ProjectAssetsPage() {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = context.store((state) => state.addNotification);
  const [selectedAsset, setSelectedAsset] = useState<Asset>();
  const createdTime = formatTimestamp(selectedAsset?.created, 'en');
  const updatedTime = formatTimestamp(selectedAsset?.updated, 'en');
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
        <Button variant="default" onClick={() => onAddAssetClicked()}>
          <FilePlusIcon className="mr-2"></FilePlusIcon>
          Add Assets
        </Button>
      </>
    );
  }

  async function onAddAssetClicked() {
    try {
      const result = await context.electron.dialog.showOpenDialog({
        title: 'Select Assets to add',
        buttonLabel: 'Add to Assets',
        properties: ['openFile', 'multiSelections'],
        filters: [
          {
            name: 'Supported files',
            extensions: [...supportedExtensionSchema.options],
          },
        ],
      });
      console.log('Selected files from dialog: ', result);
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

  async function onAssetDelete() {
    if (!selectedAsset) {
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to delete Asset',
        description: 'There was an error deleting the Asset from disk.',
      });
      return;
    }

    try {
      await context.core.assets.delete({
        ...selectedAsset,
        projectId: context.currentProject.id,
      });
      addNotification({
        intent: NotificationIntent.SUCCESS,
        title: 'Successfully deleted Asset',
        description: 'The Asset was deleted successfully.',
      });
      setSelectedAsset(undefined);
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

  async function createAssetsFromPaths(paths: string[]) {
    const assetPromisses: Promise<Asset>[] = [];

    for (const path of paths) {
      assetPromisses.push(
        context.core.assets.create({
          name: path.split('/').pop() || '',
          description: '',
          projectId: context.currentProject.id,
          language: 'en', // @todo user should select what language the file should be assigned to
          filePath: path,
        })
      );
    }

    const results = await Promise.all(assetPromisses);
    console.log('Asset create results: ', results);
  }

  /**
   * @todo This creates one commit for all instead on one per uploaded file, how is this possible?
   */
  async function onAssetsDropped(event: DragEvent) {
    event.preventDefault();

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
      layout="overlap"
    >
      <div className="flex" onDrop={onAssetsDropped}>
        <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-5 xl:gap-6">
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
                  <h2 className="text-lg">{selectedAsset.name}</h2>
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
                  <Button variant="secondary">Download</Button>
                  <Button variant="destructive" onClick={() => onAssetDelete()}>
                    <TrashIcon className="w-4 h-4 mr-2"></TrashIcon>
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Page>
  );
}
