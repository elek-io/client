import { Asset } from '@elek-io/core';
import { AssetInfo } from '@renderer/components/ui/asset-info';
import { AssetTeaser } from '@renderer/components/ui/asset-teaser';
import { Button } from '@renderer/components/ui/button';
import { Page } from '@renderer/components/ui/page';
import { NotificationIntent, useStore } from '@renderer/store';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { ReactElement, useState } from 'react';

export const Route = createFileRoute('/projects/$projectId/assets/')({
  beforeLoad: async ({ context, params }) => {
    const currentAssets = await context.core.assets.list({
      projectId: params.projectId,
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
            <AssetInfo
              projectId={context.project.id}
              asset={selectedAsset}
              language={context.user.language}
              showUpdateButton={true}
              showDeleteButton={true}
              onAssetDeleted={() => {
                setSelectedAsset(null);
                router.invalidate();
              }}
            />
          )}
        </div>
      </div>
    </Page>
  );
}
