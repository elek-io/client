import { Asset } from '@elek-io/core';
import { AssetInfo } from '@renderer/components/ui/asset-info';
import { AssetTeaser } from '@renderer/components/ui/asset-teaser';
import { Button } from '@renderer/components/ui/button';
import { Page } from '@renderer/components/ui/page';
import { assetsQueryOptions } from '@renderer/queries';
import { NotificationIntent, useStore } from '@renderer/store';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { ReactElement, useState } from 'react';

export const Route = createFileRoute('/projects/$projectId/assets/')({
  component: ProjectAssetsPage,
});

function ProjectAssetsPage(): JSX.Element {
  const router = useRouter();
  const context = Route.useRouteContext();
  const { projectId } = Route.useParams();
  const assetsQuery = useQuery(assetsQueryOptions({ projectId }));
  const addNotification = useStore((state) => state.addNotification);
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

  return (
    <Page
      title="Assets"
      description={<Description></Description>}
      actions={<Actions></Actions>}
      layout="bare"
    >
      <div className="flex">
        <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-5 xl:gap-6">
            {assetsQuery.data?.list.map((asset) => (
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
            <div className="text-sm flex flex-col items-start justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md">
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
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
