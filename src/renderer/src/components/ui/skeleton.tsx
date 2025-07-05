import { cn } from '@renderer/util';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-zinc-900/10 dark:bg-zinc-50/10',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
