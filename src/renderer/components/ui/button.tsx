import { Slot } from '@radix-ui/react-slot';
import { type VariantProps } from 'class-variance-authority';
import { LoaderCircleIcon, type LucideProps } from 'lucide-react';
import * as React from 'react';

import { cn } from '@renderer/lib/utils';
import { buttonVariants } from '@renderer/lib/variants';

function Button({
  className,
  variant,
  size,
  children,
  disabled,
  asChild = false,
  isLoading = false,
  Icon,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    isLoading?: boolean;
    Icon?: React.ComponentType<LucideProps>;
  }): React.JSX.Element {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      disabled={isLoading === true || disabled}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {isLoading ? (
        <>
          <LoaderCircleIcon className="h-4 w-4 animate-spin" />
          {children}
        </>
      ) : (
        <>
          {Icon && <Icon className="h-4 w-4" />}
          {children}
        </>
      )}
    </Comp>
  );
}

export { Button };
