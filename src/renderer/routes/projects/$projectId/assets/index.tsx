import { useMutation } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Plus } from 'lucide-react';

import {
  AssetTeaser,
  AssetTeaserSkeleton,
} from '@renderer/components/asset-teaser';
import { Page } from '@renderer/components/page';
import { Button } from '@renderer/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@renderer/components/ui/empty';
import { useBreadcrumb } from '@renderer/hooks/useBreadcrumb';
import { useQueryNoError } from '@renderer/hooks/useQueryNoError';
import { queryOptions } from '@renderer/queries';

import { type Asset } from '@elek-io/core';

export const Route = createFileRoute('/projects/$projectId/assets/')({
  component: ProjectAssetsPage,
});

function ProjectAssetsPage(): React.JSX.Element {
  const { projectId } = Route.useParams();
  useBreadcrumb(Route, 'Assets');
  const { data: assets, isPending: isListingAssets } = useQueryNoError(
    queryOptions.assets.list({
      projectId: projectId,
      limit: 0,
    })
  );
  const { mutateAsync: createAsset } = useMutation(queryOptions.assets.create);

  function Description(): React.JSX.Element {
    return (
      <>
        An Asset is a file like an image, PDF or other document that can be used
        inside your Collections.
      </>
    );
  }

  function Actions(): React.JSX.Element {
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
    const result = await window.ipc.electron.dialog.showOpenDialog({
      title: 'Select Assets to add',
      buttonLabel: 'Add to Assets',
      properties: ['openFile', 'multiSelections'],
    });

    if (result.canceled === true) {
      return;
    }

    await createAssetsFromPaths(result.filePaths);
  }

  async function createAssetsFromPaths(paths: string[]): Promise<void> {
    const assetPromises: Promise<Asset>[] = [];

    for (const path of paths) {
      assetPromises.push(
        createAsset({
          name:
            path.split('/').pop() !== undefined ? path.split('/').pop()! : '',
          description: '',
          projectId: projectId,
          filePath: path,
        })
      );
    }

    await Promise.all(assetPromises);
  }

  return (
    <Page
      title="Assets"
      description={<Description />}
      actions={<Actions />}
      layout="bare"
    >
      {isListingAssets ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-5 xl:gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <AssetTeaserSkeleton key={i} />
          ))}
        </div>
      ) : assets.total === 0 ? (
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-5 xl:gap-6">
          {assets.list.map((asset) => (
            <AssetTeaser key={asset.id} {...asset} projectId={projectId} />
          ))}
        </div>
      )}
    </Page>
  );
}
