import { cn } from '@renderer/util';
import { cva, type VariantProps } from 'class-variance-authority';
import { HTMLAttributes, type ReactElement, type ReactNode } from 'react';

const styles = cva('');

export interface PageSectionProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof styles> {
  children?: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactElement;
}

export function PageSection({
  className,
  ...props
}: PageSectionProps): JSX.Element {
  return (
    <section
      className={cn(
        'p-6 border-t border-zinc-200 dark:border-zinc-800',
        className
      )}
    >
      <div className="sm:flex sm:items-center mb-4">
        <div className="sm:flex-auto">
          <h2 className="text-base font-semibold leading-6">{props.title}</h2>
          <p className="mt-2 text-[0.8rem] text-zinc-500 dark:text-zinc-400">
            {props.description}
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          {props.actions && props.actions}
        </div>
      </div>
      {props.children}
    </section>
  );
}
