import { Asset } from '@elek-io/shared';
import {
  AssetTeaser,
  Button,
  EmptyState,
  NotificationIntent,
  Page,
  formatBytes,
  formatTimestamp,
} from '@elek-io/ui';
import { PhotoIcon, TrashIcon } from '@heroicons/react/20/solid';
import { createFileRoute, useRouter } from '@tanstack/react-router';
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
      value: `${createdTime.absolute} (${createdTime.relative})`,
    },
    {
      key: 'Updated',
      value: `${updatedTime.absolute} (${updatedTime.relative})`,
    },
    {
      key: 'Type',
      value: `${selectedAsset?.mimeType} (${selectedAsset?.extension})`,
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
        {/* <Button
          intent="primary"
          prependIcon={CogIcon}
          onClick={() => router.push(router.asPath + '/update')}
        >
          Configure
        </Button> */}
      </>
    );
  }

  async function onAddAssetClicked() {
    try {
      const result = await context.electron.dialog.showOpenDialog({
        title: 'Select Assets to add',
        buttonLabel: 'Add to Assets',
        properties: ['openFile', 'multiSelections'],
        // filters: [
        //   { name: 'Supported files', extensions: [...supportedExtensions] },
        // ],
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
      <div className="flex">
        <div>
          <ul
            role="list"
            className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-5 xl:gap-x-8"
          >
            <li>
              <EmptyState
                icon={PhotoIcon}
                title="Add Asset"
                description="Click to add or drag and drop files like images, videos and documents"
                onClick={onAddAssetClicked}
                // @ts-ignore
                onDrop={onAssetsDropped}
              ></EmptyState>
              {/* <FormInput
            name="name"
            type="text"
            label="Just a test"
            placeholder="Test me"
            onChange={handleChange}
            value={formData.name}
          ></FormInput> */}
            </li>
            {context.currentAssets.list.map((asset) => (
              <li key={asset.id} className="relative">
                <AssetTeaser
                  {...asset}
                  onClick={() => setSelectedAsset(asset)}
                ></AssetTeaser>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-72 flex-shrink-0">
          <div className="aspect-w-10 aspect-h-7 block w-full overflow-hidden">
            {selectedAsset ? (
              <img
                src={selectedAsset.absolutePath}
                alt={selectedAsset.description}
                className="object-contain border border-zinc-700"
              />
            ) : (
              <PhotoIcon></PhotoIcon>
            )}
          </div>
          <div className="mt-4 text-sm flex flex-col items-start justify-between bg-zinc-900 border border-zinc-700 rounded-md p-4">
            {selectedAsset ? (
              <>
                <div>
                  <h2 className="text-lg">{selectedAsset.name}</h2>
                  <p>{formatBytes(selectedAsset.size)}</p>
                </div>
                <div className="mt-4">
                  <h3>Information</h3>
                  <dl className="mt-2 divide-y divide-gray-200 border-t border-b border-gray-200">
                    {information.map((info) => {
                      return (
                        <div
                          key={info.key}
                          className="flex justify-between py-3"
                        >
                          <dt className="">{info.key}</dt>
                          <dd className="whitespace-nowrap">{info.value}</dd>
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
                  <Button intent="secondary">Download</Button>
                  <Button
                    intent="danger"
                    prependIcon={TrashIcon}
                    fullWidth={true}
                    onClick={() => onAssetDelete()}
                  >
                    Delete
                  </Button>
                </div>
              </>
            ) : (
              'Placeholder'
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}
