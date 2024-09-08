import { cn } from '@renderer/util';
import { DetailedHTMLProps, HTMLAttributes } from 'react';

export type SidebarNavigationProps = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
>;

function SidebarNavigation({
  className,
  ...props
}: SidebarNavigationProps): JSX.Element {
  return (
    <div className="group flex flex-col gap-4 py-2">
      <nav className={cn('grid gap-1 px-3', className)} {...props}></nav>
    </div>
  );
}

export { SidebarNavigation };
