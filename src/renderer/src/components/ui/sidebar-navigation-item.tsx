import { cn } from '@renderer/util';
import { Link, type LinkProps } from '@tanstack/react-router';

export interface SidebarNavigationItemProps extends LinkProps {}

function SidebarNavigationItem({
  activeProps,
  ...props
}: SidebarNavigationItemProps): JSX.Element {
  return (
    <Link
      {...props}
      className="relative no-underline inline-flex items-center px-3 py-2 whitespace-nowrap text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      activeProps={{
        className: cn(
          'bg-zinc-200 dark:bg-zinc-800 after:absolute after:-right-0.5 after:h-3/6 after:border-l-4 after:rounded after:border-zinc-800 dark:after:border-zinc-300',
          activeProps
        ),
      }}
      inactiveProps={{ className: '' }}
    />
  );
}

export { SidebarNavigationItem };
