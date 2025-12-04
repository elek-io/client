import { Slot } from '@radix-ui/react-slot';
import { type VariantProps } from 'class-variance-authority';

import { Separator } from '@renderer/components/ui/separator';
import { cn } from '@renderer/lib/utils';
import { buttonGroupVariants } from '@renderer/lib/variants';

function ButtonGroup({
  className,
  orientation,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof buttonGroupVariants>): React.JSX.Element {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  );
}

function ButtonGroupText({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> & {
  asChild?: boolean;
}): React.JSX.Element {
  const Comp = asChild ? Slot : 'div';

  return (
    <Comp
      className={cn(
        "flex items-center gap-2 rounded-md border bg-muted px-4 text-sm font-medium shadow-xs [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  );
}

function ButtonGroupSeparator({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof Separator>): React.JSX.Element {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        'relative m-0! self-stretch bg-input data-[orientation=vertical]:h-auto',
        className
      )}
      {...props}
    />
  );
}

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText };
