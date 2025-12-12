import { Slot } from '@radix-ui/react-slot';
import { type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { Separator } from '@renderer/components/ui/separator';
import { cn } from '@renderer/lib/utils';
import { itemMediaVariants, itemVariants } from '@renderer/lib/variants';

function ItemGroup({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      role="list"
      data-slot="item-group"
      className={cn('group/item-group flex flex-col', className)}
      {...props}
    />
  );
}

function ItemSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>): React.JSX.Element {
  return (
    <Separator
      data-slot="item-separator"
      orientation="horizontal"
      className={cn('my-0', className)}
      {...props}
    />
  );
}

function Item({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof itemVariants> & {
    asChild?: boolean;
  }): React.JSX.Element {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      data-slot="item"
      data-variant={variant}
      className={cn(itemVariants({ variant, className }))}
      {...props}
    />
  );
}

function ItemMedia({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof itemMediaVariants>): React.JSX.Element {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      className={cn(itemMediaVariants({ variant, className }))}
      {...props}
    />
  );
}

function ItemContent({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="item-content"
      className={cn(
        'flex flex-1 flex-col gap-1 p-2.5 [&+[data-slot=item-content]]:flex-none',
        className
      )}
      {...props}
    />
  );
}

function ItemTitle({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="item-title"
      className={cn(
        'flex items-center gap-2 text-sm leading-snug font-medium text-foreground',
        className
      )}
      {...props}
    />
  );
}

function ItemDescription({
  className,
  ...props
}: React.ComponentProps<'p'>): React.JSX.Element {
  return (
    <p
      data-slot="item-description"
      className={cn(
        'line-clamp-2 text-sm leading-normal font-normal text-balance text-muted-foreground',
        '[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary',
        className
      )}
      {...props}
    />
  );
}

function ItemActions({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="item-actions"
      className={cn('flex items-center gap-2', className)}
      {...props}
    />
  );
}

function ItemHeader({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="item-header"
      className={cn(
        'flex basis-full items-center justify-between gap-2',
        className
      )}
      {...props}
    />
  );
}

function ItemFooter({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="item-footer"
      className={cn(
        'flex basis-full items-center justify-between gap-2 p-2.5 pt-0',
        className
      )}
      {...props}
    />
  );
}

export {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
};
