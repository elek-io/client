import { AppHeader } from '@renderer/components/ui/app-header';
import { Button } from '@renderer/components/ui/button';
import { Page } from '@renderer/components/ui/page';
import { ScrollArea, ScrollBar } from '@renderer/components/ui/scroll-area';
import { Toaster } from '@renderer/components/ui/toast';
import {
  type ErrorComponentProps,
  Outlet,
  createRootRouteWithContext,
  useRouter,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { type ReactElement } from 'react';

export interface RouterContext extends ContextBridgeApi {}

// Use the routerContext to create your root route
export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
});

function ErrorComponent(props: ErrorComponentProps): ReactElement {
  const router = useRouter();
  const { electron } = Route.useRouteContext();

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
          onClick={() => router.navigate({ to: '/projects' })}
        >
          <ArrowLeft className="w-4 h-4 mr-2"></ArrowLeft>
          Back to Projects
        </Button>
        <Button variant="default" onClick={() => location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2"></RefreshCw>
          Reload
        </Button>
      </>
    );
  }

  return (
    <>
      <AppHeader electron={electron} />
      <Page title="Error" description={<Description />} actions={<Actions />}>
        <div className="p-6">
          <p>{props.error.message}</p>
          <ScrollArea>
            <div className="py-6 flex w-max text-xs">
              <pre>{props.error.stack}</pre>
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
  const { electron } = Route.useRouteContext();

  function Description(): ReactElement {
    return <>You&apos;ve tried accessing a route that could not be found.</>;
  }

  function Actions(): ReactElement {
    return (
      <>
        <Button
          variant="outline"
          onClick={() => router.navigate({ to: '/projects' })}
        >
          <ArrowLeft className="w-4 h-4 mr-2"></ArrowLeft>
          Back to Projects
        </Button>
        <Button variant="default" onClick={() => location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2"></RefreshCw>
          Reload
        </Button>
      </>
    );
  }

  return (
    <>
      <AppHeader electron={electron} />
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
  const { electron } = Route.useRouteContext();

  return (
    <>
      <AppHeader electron={electron} />
      <Outlet></Outlet>
      <Toaster />
      <TanStackRouterDevtools />
    </>
  );
}
