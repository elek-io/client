import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../../../util';

const chipVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap pl-4 rounded-full text-sm font-medium border border-zinc-200 shadow-sm dark:border-zinc-800'
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {}

function Chip({ className, ...props }: ChipProps) {
  return <div className={cn(chipVariants(), className)} {...props} />;
}

export { Chip, chipVariants };
