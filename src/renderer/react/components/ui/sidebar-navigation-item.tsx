import { cn } from '@/util';
import { Link, LinkProps } from '@tanstack/react-router';
import { ReactNode } from 'react';

export interface SidebarNavigationItemProps extends LinkProps {}

/**
 * @todo this whole component is more like a hack
 */
function SidebarNavigationItem(props: SidebarNavigationItemProps) {
  const className = cn(
    'cursor-pointer no-underline inline-flex items-center whitespace-nowrap text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700 h-9 rounded-md px-3 justify-start',
    props.className
  );

  if (props.to) {
    return (
      <Link
        {...props}
        className={className}
        activeProps={{
          className: cn('bg-zinc-200 dark:bg-zinc-800', props.activeProps),
        }}
        inactiveProps={{ className: '' }}
      ></Link>
    );
  }

  return (
    <a onClick={props.onClick} className={className}>
      {props.children as ReactNode}
    </a>
  );
}

export { SidebarNavigationItem };
