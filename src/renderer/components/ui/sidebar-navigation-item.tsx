import { Link, type LinkProps } from '@tanstack/react-router';
import type { ReactElement } from 'react';

import { cn } from '@renderer/lib/utils';

export interface SidebarNavigationItemProps extends LinkProps {}

function SidebarNavigationItem({
  activeProps,
  ...props
}: SidebarNavigationItemProps): ReactElement {
  return (
    <Link
      {...props}
      className="relative inline-flex items-center rounded-md px-3 py-2 text-sm whitespace-nowrap text-zinc-800 no-underline ring-offset-background transition-colors hover:bg-zinc-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-zinc-700"
      activeProps={{
        className: cn(
          'bg-zinc-200 dark:bg-zinc-800 after:absolute after:-right-0.5 after:h-3/6 after:border-l-4 after:rounded-sm after:border-zinc-800 dark:after:border-zinc-300',
          activeProps
        ),
      }}
      inactiveProps={{ className: '' }}
    />
  );
}

export { SidebarNavigationItem };
