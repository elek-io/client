import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  type ErrorComponentProps,
  Outlet,
  createRootRouteWithContext,
  useRouter,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { type ReactElement } from 'react';

import { AppHeader } from '@renderer/components/app-header';
import { Page } from '@renderer/components/page';
import { Button } from '@renderer/components/ui/button';
import { ScrollArea, ScrollBar } from '@renderer/components/ui/scroll-area';
import { Toaster } from '@renderer/components/ui/sonner';

export interface RouterContext {}

// Use the routerContext to create your root route
export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
});

function ErrorComponent({ error }: ErrorComponentProps): ReactElement {
  const router = useRouter();

  void window.ipc.core.logger.error({
    source: 'desktop',
    message: `Uncaught route error: ${error.message}`,
    meta: { error: { message: error.message, stack: error.stack } },
  });

  function Description(): ReactElement {
    return (
      <>
        Unfortunately you&apos;ve encountered an error. But don&apos;t worry, if
        you have allowed us to send error reports we know about and will take
        care of it soon. If you need additional help, please contact our
        support.
      </>
    );
  }

  function Actions(): ReactElement {
    return (
      <>
        <Button
          variant="outline"
          onClick={async () => router.navigate({ to: '/projects' })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
        <Button variant="default" onClick={() => location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reload
        </Button>
      </>
    );
  }

  return (
    <>
      <AppHeader electron={window.ipc.electron} />
      <Page title="Error" description={<Description />} actions={<Actions />}>
        <div className="p-6">
          <p>{error.message}</p>
          <ScrollArea>
            <div className="flex w-max py-6 text-xs">
              <pre>{error.stack}</pre>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </Page>
    </>
  );
}

function NotFoundComponent(): ReactElement {
  const router = useRouter();

  function Description(): ReactElement {
    return <>You&apos;ve tried accessing a route that could not be found.</>;
  }

  function Actions(): ReactElement {
    return (
      <>
        <Button
          variant="outline"
          onClick={async () => router.navigate({ to: '/projects' })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
        <Button variant="default" onClick={() => location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reload
        </Button>
      </>
    );
  }

  return (
    <>
      <AppHeader electron={window.ipc.electron} />
      <Page
        title="Not Found"
        description={<Description />}
        actions={<Actions />}
      >
        <p className="p-6">
          You&apos;ve tried to access &quot;{location.href}&quot; but it does
          not exist. Use the buttons above to navigate back or try to reload the
          page.
        </p>
      </Page>
    </>
  );
}

function RootComponent(): ReactElement {
  return (
    <>
      <AppHeader electron={window.ipc.electron} />
      <Outlet></Outlet>
      <Toaster />
      <TanStackRouterDevtools position="bottom-right" initialIsOpen={false} />
      <ReactQueryDevtools position="bottom" initialIsOpen={false} />
    </>
  );
}
