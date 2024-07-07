import { Asset } from '@elek-io/core';
import { cva, type VariantProps } from 'class-variance-authority';
import type { MouseEventHandler } from 'react';
import { formatBytes } from '../../../../util';
import { AssetDisplay } from './asset-display';

const styles = cva('');

export interface AssetTeaserProps extends VariantProps<typeof styles>, Asset {
  onClick?: MouseEventHandler;
}

export function AssetTeaser(props: AssetTeaserProps) {
  return (
    <a
      className="cursor-pointer no-underline transition-colors bg-white dark:bg-zinc-900 hover:bg-zinc-300 hover:dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-md p-2"
      onClick={props.onClick}
    >
      <div>
        <div className="aspect-4/3 flex items-center justify-center">
          <AssetDisplay {...props} preview={false}></AssetDisplay>
        </div>
        <p className="mt-2 truncate text-sm">{props.name}</p>
        <p className="text-sm">{formatBytes(props.size)}</p>
      </div>
    </a>
  );
}
