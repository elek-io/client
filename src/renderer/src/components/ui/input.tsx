import { cn } from '@renderer/util';
import { forwardRef, type InputHTMLAttributes } from 'react';

const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      className={cn(
        'flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-brand-600 disabled:cursor-not-allowed dark:border-zinc-800 dark:placeholder:text-zinc-400',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
