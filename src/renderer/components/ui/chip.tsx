import { type VariantProps } from 'class-variance-authority';
import { type HTMLAttributes, type ReactElement } from 'react';

import { cn } from '@renderer/lib/utils';
import { chipVariants } from '@renderer/lib/variants';

export interface ChipProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {}

function Chip({ className, ...props }: ChipProps): ReactElement {
  return <div className={cn(chipVariants(), className)} {...props} />;
}

export { Chip };
