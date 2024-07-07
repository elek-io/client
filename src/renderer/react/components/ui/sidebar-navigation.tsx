import * as React from 'react';

import { cn } from '../../../../util';

export type SidebarNavigationProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
>;

function SidebarNavigation({ className, ...props }: SidebarNavigationProps) {
  return (
    <div className="group flex flex-col gap-4 py-2">
      <nav className={cn('grid gap-1 px-2', className)} {...props}></nav>
    </div>
  );
}

export { SidebarNavigation };
