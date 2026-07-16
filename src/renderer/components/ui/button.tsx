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
  type,
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
      // Default a real button to type="button" so one used for a click action
      // never submits a surrounding form. A submit button opts in with
      // type="submit". Leave asChild alone, since the rendered child (an anchor,
      // a Radix trigger) owns its own semantics.
      type={asChild ? type : (type ?? 'button')}
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
          {Icon ? <Icon className="h-4 w-4" /> : null}
          {children}
        </>
      )}
    </Comp>
  );
}

export { Button };
