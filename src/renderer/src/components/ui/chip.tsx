import { cn } from '@renderer/util';
import { cva, type VariantProps } from 'class-variance-authority';
import { HTMLAttributes } from 'react';

const chipVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap px-4 py-1 rounded-full text-sm font-medium border border-zinc-200 shadow-sm dark:border-zinc-800'
);

export interface ChipProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {}

function Chip({ className, ...props }: ChipProps): JSX.Element {
  return <div className={cn(chipVariants(), className)} {...props} />;
}

export { Chip, chipVariants };
