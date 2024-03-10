import { cva, type VariantProps } from 'class-variance-authority';
import { type ReactElement, type ReactNode } from 'react';

const styles = cva('');

export interface PageProps extends VariantProps<typeof styles> {
  title: string;
  description?: ReactElement;
  actions?: ReactElement;
  layout?: 'overlap' | 'overlap-card' | 'overlap-card-no-space';
  children: ReactNode;
}

export function Page(props: PageProps) {
  return (
    <main className="relative flex-1 overflow-y-auto">
      <div className="relative overflow-hidden bg-brand-900 pb-32">
        <div className="relative container mx-auto">
          <div className="md:flex md:items-center px-4 sm:px-6 lg:px-8 py-10">
            <div className="md:flex-auto">
              <h2 className="mt-2 text-3xl">{props.title}</h2>
              {props.description && (
                <p className="mt-2 text-sm">{props.description}</p>
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
            {props.layout === 'overlap' ? (
              <>{props.children}</>
            ) : props.layout === 'overlap-card-no-space' ? (
              <div className="rounded-lg bg-white shadow">{props.children}</div>
            ) : (
              <div className="rounded-lg bg-white shadow p-4">
                {props.children}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
