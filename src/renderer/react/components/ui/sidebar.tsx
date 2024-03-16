import * as React from 'react';

import { cn } from '@/util';

export interface SidebarProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLElement>,
    HTMLElement
  > {
  isNarrow?: boolean;
}

function Sidebar({ className, isNarrow, ...props }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col flex-shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800',
        isNarrow ? 'w-18' : 'w-60',
        className
      )}
      {...props}
    ></aside>
  );
}

export { Sidebar };
