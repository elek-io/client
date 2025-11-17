import type { MouseEventHandler, ReactElement } from 'react';

import { AssetDisplay } from '@renderer/components/ui/asset-display';
import { formatBytes } from '@renderer/lib/utils';

import { type Asset } from '@elek-io/core';

export interface AssetTeaserProps extends Asset {
  onClick?: MouseEventHandler;
}

export function AssetTeaser(props: AssetTeaserProps): ReactElement {
  return (
    <a
      className="cursor-pointer rounded-md border border-zinc-200 bg-white p-2 text-zinc-800 no-underline transition-colors hover:bg-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 hover:dark:bg-zinc-700"
      onClick={props.onClick}
    >
      <div>
        <div className="flex aspect-4/3 items-center justify-center">
          <AssetDisplay {...props} static />
        </div>
        <p className="mt-2 truncate text-sm">{props.name}</p>
        <p className="text-sm">
          {formatBytes(props.size)} - {props.extension.toUpperCase()}
        </p>
      </div>
    </a>
  );
}
