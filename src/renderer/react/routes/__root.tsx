import { cn } from '@/util';
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
  Moon,
  Sun,
} from 'lucide-react';
import { Fragment } from 'react';
import { StoreApi, UseBoundStore } from 'zustand';
import { ContextBridgeApi } from '../../preload';
import { useTheme } from '../components/theme-provider';
import { Avatar } from '../components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '../components/ui/breadcrumb';
import { Button } from '../components/ui/button';
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
} from '../components/ui/dropdown-menu';
import { Toaster } from '../components/ui/toast';
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
  const [isProjectSidebarNarrow, setIsProjectSidebarNarrow] = context.store(
    (state) => [state.isProjectSidebarNarrow, state.setIsProjectSidebarNarrow]
  );
  const { theme, setTheme } = useTheme();
  const breadcrumbs = state.location.pathname
    .split('/')
    .filter((value) => value) // Filter out empty values for beginning or ending slashes
    .map((part, index, array) => {
      const path = array.slice(0, index + 1).join('/');

      const projectMatch = context.projects.list.find((project) => {
        return project.id === part;
      });

      if (projectMatch) {
        part = projectMatch.name;
      }

      return {
        part,
        path,
        full: state.location.pathname,
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
            elek.<span className="text-brand-600">io</span>{' '}
            <strong className="text-xs">Client</strong>
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
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.history.forward()}
              >
                <ArrowRight className="h-4 w-4"></ArrowRight>
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
                      name={context.currentUser.name}
                      src="https://github.com/shadcn.png"
                    ></Avatar>
                    {context.currentUser.name}
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
                            onValueChange={setTheme}
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
