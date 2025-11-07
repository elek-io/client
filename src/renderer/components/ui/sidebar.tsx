import {
  type DetailedHTMLProps,
  type HTMLAttributes,
  type ReactElement,
} from 'react';

import { cn } from '@renderer/lib/utils';

export interface SidebarProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
  isNarrow?: boolean;
}

function Sidebar({
  className,
  isNarrow,
  ...props
}: SidebarProps): ReactElement {
  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900',
        isNarrow ? 'w-18' : 'w-60',
        className
      )}
      {...props}
    ></aside>
  );
}

export { Sidebar };
