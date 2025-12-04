import React from 'react';

import { cn } from '@renderer/lib/utils';

function Skeleton({
  className,
  ...props
}: React.ComponentProps<'span'>): React.JSX.Element {
  return (
    <span
      data-slot="skeleton"
      className={cn('block animate-pulse rounded-md bg-accent', className)}
      {...props}
    />
  );
}

export { Skeleton };
