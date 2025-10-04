import { cn } from '@renderer/util';
import { cva, type VariantProps } from 'class-variance-authority';
import { type HTMLAttributes, type ReactElement } from 'react';

const chipVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap px-4 py-1 rounded-full text-sm font-medium border border-zinc-200 shadow-xs dark:border-zinc-800'
);

export interface ChipProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {}

function Chip({ className, ...props }: ChipProps): ReactElement {
  return <div className={cn(chipVariants(), className)} {...props} />;
}

export { Chip, chipVariants };
