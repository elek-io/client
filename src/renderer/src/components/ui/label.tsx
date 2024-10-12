'use client';

import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@renderer/util';
import { cva, type VariantProps } from 'class-variance-authority';
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
);

export interface LabelProps
  extends ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  isRequired?: boolean;
}

const Label = forwardRef<ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, isRequired, ...props }, ref) => (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants(), className)}
      {...props}
    >
      {props.children}
      {isRequired === false && (
        <span className="text-[0.8rem] text-zinc-500 dark:text-zinc-400">
          {' '}
          - optional
        </span>
      )}
    </LabelPrimitive.Root>
  )
);
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
