'use client';

import { ComponentProps } from 'react';
import { Toaster as Sonner, toast } from 'sonner';
import { useTheme } from '../theme-provider';

type ToasterProps = ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps): JSX.Element => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      richColors={true}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-zinc-950 group-[.toaster]:border-zinc-200 group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-zinc-950 dark:group-[.toaster]:text-zinc-50 dark:group-[.toaster]:border-zinc-800',
          description:
            'group-[.toast]:text-zinc-500 dark:group-[.toast]:text-zinc-400',
          actionButton:
            'group-[.toast]:bg-zinc-900 group-[.toast]:text-zinc-50 dark:group-[.toast]:bg-zinc-50 dark:group-[.toast]:text-zinc-900',
          cancelButton:
            'group-[.toast]:bg-zinc-100 group-[.toast]:text-zinc-500 dark:group-[.toast]:bg-zinc-800 dark:group-[.toast]:text-zinc-400',
        },
      }}
      {...props}
    />
  );
};

export { toast, Toaster };
