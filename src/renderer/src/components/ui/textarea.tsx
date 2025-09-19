import { cn } from '@renderer/util';
import * as React from 'react';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 placeholder:text-muted-foreground focus-visible:ring-brand-600 focus-visible:ring-1 aria-invalid:ring-red-500 aria-invalid:border-red-500 flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
