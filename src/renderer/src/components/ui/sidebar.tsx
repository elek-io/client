import { cn } from '@renderer/util';
import { DetailedHTMLProps, HTMLAttributes } from 'react';

export interface SidebarProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
  isNarrow?: boolean;
}

function Sidebar({ className, isNarrow, ...props }: SidebarProps): JSX.Element {
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
