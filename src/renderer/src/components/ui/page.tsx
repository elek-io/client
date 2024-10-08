import { cn } from '@renderer/util';
import {
  DragEventHandler,
  forwardRef,
  HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { ScrollArea } from './scroll-area';

export interface PageProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description?: ReactElement;
  actions?: ReactElement;
  layout?: 'bare';
  children?: ReactNode;
  onDragOver?: DragEventHandler<HTMLElement>;
  onDragLeave?: DragEventHandler<HTMLElement>;
  onDragEnter?: DragEventHandler<HTMLElement>;
  onDrop?: DragEventHandler<HTMLElement>;
}

export const Page = forwardRef<HTMLElement, PageProps>(
  ({ className, ...props }, ref) => (
    <ScrollArea>
      <main
        ref={ref}
        className={cn('relative flex-1', className)}
        onDragOver={props.onDragOver}
        onDragLeave={props.onDragLeave}
        onDragEnter={props.onDragEnter}
        onDrop={props.onDrop}
      >
        <div className="relative bg-brand-950 text-white pb-32">
          <div className="relative container mx-auto">
            <div className="md:flex md:items-center px-4 sm:px-6 lg:px-8 py-10">
              <div className="md:flex-auto">
                <h2 className="text-3xl">{props.title}</h2>
                {props.description && (
                  <p className="mt-2 text-sm max-w-screen-sm">
                    {props.description}
                  </p>
                )}
              </div>
              <div className="mt-4 md:mt-0 md:ml-16 md:flex-none flex flex-row space-x-2">
                {props.actions && props.actions}
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="relative container mx-auto -mt-32">
            <div className="p-4 sm:p-6 lg:p-8 !pt-0">
              {props.layout === 'bare' ? (
                <>{props.children}</>
              ) : (
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow">
                  {props.children}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </ScrollArea>
  )
);
Page.displayName = 'Page';
