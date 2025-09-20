import { Slot } from '@radix-ui/react-slot';
import { cn } from '@renderer/util';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircleIcon, type LucideProps } from 'lucide-react';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-brand-600 focus-visible:ring-1 aria-invalid:ring-red-500 aria-invalid:border-red-500",
  {
    variants: {
      variant: {
        default: 'bg-brand-600 text-white shadow-xs hover:bg-brand-600/90',
        destructive:
          'bg-red-500 text-zinc-50 shadow-xs hover:bg-red-500/90 dark:bg-red-900 dark:text-zinc-50 dark:hover:bg-red-900/90',
        outline:
          'border border-zinc-200 bg-white shadow-xs hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-zinc-50',
        secondary:
          'bg-zinc-100 text-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xs hover:bg-zinc-100/80 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800/80',
        ghost:
          'hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50',
        link: 'text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

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
  }) {
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
          <LoaderCircleIcon className="w-4 h-4 animate-spin" />
          {children}
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4" />}
          {children}
        </>
      )}
    </Comp>
  );
}

export { Button };
