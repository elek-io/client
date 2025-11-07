import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { type ReactElement, useState } from 'react';

import { AssetInfo } from '@renderer/components/ui/asset-info';
import { AssetTeaser } from '@renderer/components/ui/asset-teaser';
import { Button } from '@renderer/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@renderer/components/ui/empty';
import { Page } from '@renderer/components/ui/page';
import { useStore } from '@renderer/store';

import { type Asset } from '@elek-io/core';

export const Route = createFileRoute('/projects/$projectId/assets/')({
  beforeLoad: async ({ context, params }) => {
    const currentAssets = await context.core.assets.list({
      projectId: params.projectId,
    });

    return { currentAssets };
  },
  component: ProjectAssetsPage,
});

function ProjectAssetsPage(): ReactElement {
  const router = useRouter();
  const context = Route.useRouteContext();
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
        <Button
          variant="default"
          Icon={Plus}
          onClick={async () => onAddAssets()}
        >
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
      await router.invalidate();
    } catch (error) {
      await context.core.logger.error({
        source: 'desktop',
        message: 'Failed to open dialog',
        meta: { error },
      });
      addNotification({
        intent: 'danger',
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

    await Promise.all(assetPromisses);
  }

  return (
    <Page
      title="Assets"
      description={<Description />}
      actions={<Actions />}
      layout="bare"
    >
      {context.currentAssets.total === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Plus />
            </EmptyMedia>
            <EmptyTitle>No Assets yet</EmptyTitle>
            <EmptyDescription>
              You haven&apos;t added any Assets yet. Get started by adding one
              or more Assets by clicking the button in the top right corner.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex">
          <div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-5 xl:gap-6">
              {context.currentAssets.list.map((asset) => (
                <AssetTeaser
                  key={asset.id}
                  {...asset}
                  onClick={() => setSelectedAsset(asset)}
                />
              ))}
            </div>
          </div>
          <div className="ml-8 w-72 shrink-0">
            {selectedAsset ? (
              <div className="flex flex-col items-start justify-between rounded-md border border-zinc-200 bg-white text-sm dark:border-zinc-800 dark:bg-zinc-900">
                <AssetInfo
                  projectId={context.project.id}
                  asset={selectedAsset}
                  language={context.user.language}
                  showUpdateButton
                  showDeleteButton
                  onAssetDeleted={async () => {
                    setSelectedAsset(null);
                    await router.invalidate();
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </Page>
  );
}
