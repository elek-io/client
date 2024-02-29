import { Asset } from '@elek-io/shared';
import { AssetTeaser, EmptyState, NotificationIntent, Page } from '@elek-io/ui';
import { PhotoIcon } from '@heroicons/react/20/solid';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { ReactElement } from 'react';

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

  //   async function onAssetDelete() {
  //     if (!selectedAsset || !props.currentProject) {
  //       addNotification({
  //         intent: NotificationIntent.DANGER,
  //         title: 'Failed to delete Asset',
  //         description: 'There was an error deleting the Asset from disk.',
  //       });
  //       return;
  //     }

  //     try {
  //       await window.ipc.core.assets.delete({
  //         ...selectedAsset,
  //         projectId: props.currentProject.id,
  //       });
  //       addNotification({
  //         intent: NotificationIntent.SUCCESS,
  //         title: 'Successfully deleted Asset',
  //         description: 'The Asset was deleted successfully.',
  //       });
  //       setIsAsideOpen(false);
  //       setSelectedAsset(undefined);
  //       await reloadAssets();
  //     } catch (error) {
  //       console.error(error);
  //       addNotification({
  //         intent: NotificationIntent.DANGER,
  //         title: 'Failed to delete Asset',
  //         description: 'There was an error deleting the Asset from disk.',
  //       });
  //     }
  //   }

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
      <ul
        role="list"
        className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 xl:gap-x-8"
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
            <AssetTeaser {...asset}></AssetTeaser>
          </li>
        ))}
      </ul>
    </Page>
  );
}
