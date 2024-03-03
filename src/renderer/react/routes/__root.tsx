import { DropdownItemGroup } from '@elek-io/ui';
import {
  DocumentDuplicateIcon,
  HomeIcon,
  PencilSquareIcon,
} from '@heroicons/react/20/solid';
import { ArrowLeftIcon, ArrowRightIcon } from '@radix-ui/react-icons';
import {
  Link,
  Outlet,
  createRootRouteWithContext,
  redirect,
  useRouter,
  useRouterState,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { StoreApi, UseBoundStore } from 'zustand';
import { ContextBridgeApi } from '../../preload';
import { Button } from '../components/ui/button';
import { StoreState } from '../store';

interface RouterContext {
  electron: ContextBridgeApi['electron'];
  core: ContextBridgeApi['core'];
  store: UseBoundStore<StoreApi<StoreState>>;
}

// Use the routerContext to create your root route
export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context, location }) => {
    const currentUser = await context.core.user.get();
    if (!currentUser) {
      throw redirect({
        to: '/user/set',
        search: {
          redirect: location.href,
        },
      });
    }
    const projects = await context.core.projects.list({ limit: 0 });
    return { currentUser, projects };
  },
  component: RootRoute,
});

function RootRoute() {
  const router = useRouter();
  const context = Route.useRouteContext();
  const state = useRouterState();
  const breadcrumbs = state.location.pathname
    .split('/')
    .filter((value) => value) // Filter out empty values for beginning or ending slashes
    .map((part, index, array) => {
      const path = array.slice(0, index + 1).join('/');

      return {
        part,
        path,
        full: state.location.pathname,
      };
    });
  const dropdownItemGroupsExample: DropdownItemGroup[] = [
    {
      items: [
        {
          name: 'Edit',
          href: '#edit',
          icon: PencilSquareIcon,
        },
        {
          name: 'Duplicate',
          href: '#duplicate',
          icon: DocumentDuplicateIcon,
        },
      ],
    },
  ];

  return (
    <>
      <header className="w-full bg-zinc-900 window-draggable-area">
        <div
          id="app-bar"
          className="p-2 text-sm text-center border-b border-zinc-800"
        >
          <h1>
            elek.<span className="text-brand-600">io</span>{' '}
            <strong className="text-xs">Client</strong>
          </h1>
        </div>
        <div id="navigation-bar" className="flex border-b border-zinc-800">
          <div className="p-2 w-60 flex flex-shrink-0 justify-end border-r border-zinc-800">
            Sidebar toggle
          </div>
          <div className="p-2 flex-auto flex justify-between items-center">
            <div className="flex">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.history.back()}
              >
                <ArrowLeftIcon className="h-4 w-4"></ArrowLeftIcon>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.history.forward()}
              >
                <ArrowRightIcon className="h-4 w-4"></ArrowRightIcon>
              </Button>
              <nav className="flex" aria-label="Breadcrumb">
                <ol
                  role="list"
                  className="flex space-x-2 rounded-md bg-zinc-800 border border-zinc-700 px-4"
                >
                  <li className="flex">
                    <div className="flex items-center">
                      <Link to="/" className="text-zinc-200 no-underline">
                        <HomeIcon className="w-4" />
                        <span className="sr-only">Home</span>
                      </Link>
                    </div>
                  </li>
                  {breadcrumbs.map((crumb) => (
                    <li className="flex">
                      <div className="flex items-center">
                        <svg
                          className="h-full w-4 flex-shrink-0 text-zinc-700"
                          viewBox="0 0 24 44"
                          preserveAspectRatio="none"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
                        </svg>
                        <Link
                          className="ml-2 text-sm text-zinc-200 no-underline font-medium truncate"
                          to={crumb.path}
                        >
                          {crumb.part}
                        </Link>
                      </div>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
            <div>
              {/* <Dropdown itemGroups={dropdownItemGroupsExample}>
                <Button intent="avatar" appendIcon={ChevronDownIcon}>
                  <Avatar name={context.currentUser.name}></Avatar>
                  <span className="ml-2 hidden lg:block">
                    {context.currentUser.name}
                  </span>
                </Button>
              </Dropdown> */}
            </div>
          </div>
        </div>
      </header>
      <Outlet></Outlet>
      <TanStackRouterDevtools />
    </>
  );
}
