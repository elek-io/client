'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@renderer/util';
import {
  ComponentPropsWithoutRef,
  ElementRef,
  forwardRef,
  ForwardRefExoticComponent,
  RefAttributes,
} from 'react';

interface AvatarProps extends AvatarPrimitive.AvatarProps {
  name: string;
  src?: string;
}

const Avatar = forwardRef<
  ElementRef<typeof AvatarBase>,
  ComponentPropsWithoutRef<
    ForwardRefExoticComponent<AvatarProps & RefAttributes<HTMLSpanElement>>
  >
>(({ className, ...props }, ref) => {
  function initials(name: string): string {
    const rgx = new RegExp(/(\p{L}{1})\p{L}+/, 'gu');
    const initials = [...name.matchAll(rgx)] || [];

    return (
      (initials.shift()?.[1] || '') + (initials.pop()?.[1] || '')
    ).toUpperCase();
  }

  return (
    <AvatarBase ref={ref} className={cn('w-8 h-8', className)} {...props}>
      {props.src && <AvatarImage src={props.src}></AvatarImage>}
      <AvatarFallback>{initials(props.name)}</AvatarFallback>
    </AvatarBase>
  );
});
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarBase = forwardRef<
  ElementRef<typeof AvatarPrimitive.Root>,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      className
    )}
    {...props}
  />
));
AvatarBase.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = forwardRef<
  ElementRef<typeof AvatarPrimitive.Image>,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = forwardRef<
  ElementRef<typeof AvatarPrimitive.Fallback>,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-brand-600 text-zinc-200',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarBase, AvatarFallback, AvatarImage };
