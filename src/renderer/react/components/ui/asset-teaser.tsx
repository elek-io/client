import { formatBytes } from '@/util';
import type { Asset } from '@elek-io/shared';
import { cva, type VariantProps } from 'class-variance-authority';
import type { MouseEventHandler } from 'react';
import { AssetDisplay } from './asset-display';

const styles = cva('');

export interface AssetTeaserProps extends VariantProps<typeof styles>, Asset {
  onClick?: MouseEventHandler;
}

export function AssetTeaser(props: AssetTeaserProps) {
  return (
    <div
      className="flex flex-col h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-2"
      onClick={props.onClick}
    >
      <div>
        <div className="aspect-4/3 flex items-center justify-center">
          <AssetDisplay {...props} preview={false}></AssetDisplay>
        </div>
        <p className="mt-2 truncate text-sm">{props.name}</p>
        <p className="text-sm">{formatBytes(props.size)}</p>
      </div>
    </div>
  );
}
