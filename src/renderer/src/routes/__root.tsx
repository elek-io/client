import { electronAPI } from '@electron-toolkit/preload';
import { ElekIoCore } from '@elek-io/core';
import { Theme, useTheme } from '@renderer/components/theme-provider';
import { Avatar } from '@renderer/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@renderer/components/ui/breadcrumb';
import { Button } from '@renderer/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import { Toaster } from '@renderer/components/ui/toast';
import { useStore } from '@renderer/store';
import { cn } from '@renderer/util';
import {
  Link,
  Outlet,
  createRootRouteWithContext,
  redirect,
  useRouter,
  useRouterState,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import {
  ArrowLeft,
  ArrowLeftToLine,
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Moon,
  Sun,
} from 'lucide-react';
import { Fragment } from 'react';
import {
  version as clientVersion,
  dependencies,
} from '../../../../package.json';

export interface RouterContext {
  electron: typeof electronAPI;
  core: ElekIoCore;
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
  loader: ({ context }) => context,
  component: RootComponent,
});

function RootComponent(): JSX.Element {
  const router = useRouter();
  const routerState = useRouterState();
  const { currentUser, electron } = Route.useLoaderData();
  const [isProjectSidebarNarrow, setIsProjectSidebarNarrow] = useStore(
    (storeState) => [
      storeState.isProjectSidebarNarrow,
      storeState.setIsProjectSidebarNarrow,
    ]
  );
  const { theme, setTheme } = useTheme();
  const breadcrumbLookupMap = useStore(
    (storeState) => storeState.breadcrumbLookupMap
  );
  const breadcrumbs = routerState.location.pathname
    .split('/')
    .filter((value) => value) // Filter out empty values for beginning or ending slashes
    .map((part, index, array) => {
      const path = array.slice(0, index + 1).join('/');

      // @todo add translation for static breadcrumb parts
      switch (part) {
        case 'projects':
          part = 'Projects';
          break;
        case 'dashboard':
          part = 'Dashboard';
          break;
        case 'assets':
          part = 'Assets';
          break;
        case 'collections':
          part = 'Collections';
          break;
        case 'settings':
          part = 'Settings';
          break;
        case 'create':
          part = 'Create';
          break;
        case 'update':
          part = 'Update';
          break;
        case 'general':
          part = 'General';
          break;
        case 'en':
          part = 'English'; // @todo mapping between locale ID and localized name
          break;
        default:
          break;
      }

      // Use names instead of IDs to display
      const match = breadcrumbLookupMap.get(part);
      if (match) {
        part = match;
      }

      return {
        part,
        path,
        full: routerState.location.pathname,
      };
    });

  return (
    <>
      <header className="w-full window-draggable-area bg-white dark:bg-zinc-900">
        <div
          id="app-bar"
          className="p-2 text-sm text-center border-b border-zinc-200 dark:border-zinc-800"
        >
          <h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size={'sm'}>
                  elek.<span className="text-brand-600">io</span>
                  <strong className="ml-2 text-xs">Client</strong>
                  <ChevronDown className="ml-2 h-4 w-4"></ChevronDown>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-4 mr-2 window-not-draggable-area">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() =>
                      window.open(
                        'https://github.com/elek-io/client/issues',
                        '_blank'
                      )
                    }
                  >
                    Report an issue
                    <DropdownMenuShortcut>
                      <ExternalLink className="w-4 h-4"></ExternalLink>
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    elek.io Client
                    <DropdownMenuShortcut>
                      v{clientVersion}
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    elek.io Core
                    <DropdownMenuShortcut>
                      v{dependencies['@elek-io/core']}
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    Electron
                    <DropdownMenuShortcut>
                      v{electron.process.versions['electron']}
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Chromium
                    <DropdownMenuShortcut>
                      v{electron.process.versions['chrome']}
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Node
                    <DropdownMenuShortcut>
                      v{electron.process.versions['node']}
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </h1>
        </div>
        <div
          id="navigation-bar"
          className="flex border-b border-zinc-200 dark:border-zinc-800"
        >
          <div className="p-2 w-60 flex flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsProjectSidebarNarrow(!isProjectSidebarNarrow)}
            >
              <ArrowLeftToLine
                className={cn(
                  'h-4 w-4 transition',
                  isProjectSidebarNarrow && 'rotate-180'
                )}
              ></ArrowLeftToLine>
              <span className="sr-only">
                {isProjectSidebarNarrow
                  ? '__root.buttonSetSidebarToWide'
                  : '__root.buttonSetSidebarToNarrow'}
              </span>
            </Button>
          </div>
          <div className="p-2 flex-auto flex justify-between items-center">
            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.history.back()}
              >
                <ArrowLeft className="h-4 w-4"></ArrowLeft>
                <span className="sr-only">{'__root.buttonNavigateBack'}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.history.forward()}
              >
                <ArrowRight className="h-4 w-4"></ArrowRight>
                <span className="sr-only">
                  {'__root.buttonNavigateForward'}
                </span>
              </Button>

              <Breadcrumb className="flex ml-2">
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index, array) => (
                    <Fragment key={crumb.path}>
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link
                            to={crumb.path}
                            className="text-zinc-800 dark:text-zinc-200 no-underline hover:underline"
                          >
                            {crumb.part}
                          </Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      {array.length !== index + 1 && <BreadcrumbSeparator />}
                    </Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">
                    <Avatar
                      className="w-8 h-8 mr-2"
                      name={currentUser.name}
                      src="https://github.com/shadcn.png"
                    ></Avatar>
                    {currentUser.name}
                    <ChevronDown className="ml-2 h-4 w-4"></ChevronDown>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-4 mr-2">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      Profile
                      <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Billing
                      <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Settings
                      <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Keyboard shortcuts
                      <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>Team</DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuRadioGroup
                            value={theme}
                            onValueChange={(theme) => setTheme(theme as Theme)}
                          >
                            <DropdownMenuRadioItem value="system">
                              System
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="light">
                              <Sun className="h-4 w-4 mr-2" />
                              Light
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="dark">
                              <Moon className="h-4 w-4 mr-2" />
                              Dark
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuItem>
                      New Team
                      <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>GitHub</DropdownMenuItem>
                  <DropdownMenuItem>Support</DropdownMenuItem>
                  <DropdownMenuItem disabled>API</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    Log out
                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
      <Toaster />
      <TanStackRouterDevtools />
    </>
  );
}
