import { ImageIcon } from 'lucide-react';
import type { MouseEventHandler } from 'react';

import { AssetDisplay } from '@renderer/components/asset-display';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle,
} from '@renderer/components/ui/item';
import { Skeleton } from '@renderer/components/ui/skeleton';
import { formatBytes } from '@renderer/lib/utils';

import { type Asset } from '@elek-io/core';

export function AssetTeaser({
  onClick,
  ...assetProps
}: Asset & { onClick?: MouseEventHandler }): React.JSX.Element {
  return (
    <Item variant="outline" asChild>
      <a onClick={onClick} className="no-underline hover:cursor-pointer">
        <ItemHeader className="aspect-4/3">
          <AssetDisplay {...assetProps} static className="rounded-t-md" />
        </ItemHeader>
        <ItemContent>
          <ItemTitle className="line-clamp-2">{assetProps.name}</ItemTitle>
          <ItemDescription>
            {formatBytes(assetProps.size)} -{' '}
            {assetProps.extension.toUpperCase()}
          </ItemDescription>
        </ItemContent>
      </a>
    </Item>
  );
}

export function AssetTeaserSkeleton(): React.JSX.Element {
  return (
    <Item variant="outline">
      <ItemHeader className="aspect-4/3">
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
        </div>
      </ItemHeader>
      <ItemContent>
        <ItemTitle>
          <Skeleton className="h-4 w-3/4" />
        </ItemTitle>
        <ItemDescription>
          <Skeleton className="h-3 w-1/2" />
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}
