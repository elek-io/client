import { parseIpcError } from '@root/src/shared/ipcError';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  type ErrorComponentProps,
  HeadContent,
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
import { UserHeader } from '@renderer/components/user-header';
import { BreadcrumbProvider } from '@renderer/providers/BreadcrumbProvider';
import { UserProvider } from '@renderer/providers/UserProvider';

export interface RouterContext {}

// Use the routerContext to create your root route
export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
  // The title lives here instead of index.html,
  // since routes can then override it via their own head option
  head: () => ({
    meta: [
      {
        title: 'elek.io Desktop',
      },
    ],
  }),
});

function ErrorComponent({ error }: ErrorComponentProps): ReactElement {
  const router = useRouter();

  // A CoreError that crossed IPC arrives with its type, message and Core's origin
  // stack encoded into the message. Decode all of it so we show and log clean
  // copy, never the raw sentinel JSON. A non-Core error (route or JS error) has
  // no encoded stack, so fall back to its own stack, which carries no sentinel to
  // leak.
  const { message, stack } = parseIpcError(error);
  const displayStack = stack ?? error.stack;

  void window.ipc.core.logger.error({
    source: 'desktop',
    message: `Uncaught route error: ${message}`,
    meta: { error: { message, stack: displayStack } },
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
      <AppHeader />
      <Page title="Error" description={<Description />} actions={<Actions />}>
        <div className="p-6">
          <p>{message}</p>
          <ScrollArea>
            <div className="flex w-max py-6 text-xs">
              <pre>{displayStack}</pre>
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
      <AppHeader />
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
      <HeadContent />
      <UserProvider>
        <BreadcrumbProvider>
          <AppHeader />
          <UserHeader />
          <Outlet />
          <Toaster />
          <TanStackRouterDevtools
            position="bottom-right"
            initialIsOpen={false}
          />
          <ReactQueryDevtools position="bottom" initialIsOpen={false} />
        </BreadcrumbProvider>
      </UserProvider>
    </>
  );
}
