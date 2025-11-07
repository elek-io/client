import { Link, useRouter, useRouterState } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, ChevronDown, Moon, Sun } from 'lucide-react';
import { forwardRef, Fragment, type HTMLAttributes } from 'react';

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
import { useTheme, type Theme } from '@renderer/hooks/useTheme';
import { useStore } from '@renderer/store';

import { type User } from '@elek-io/core';

export interface UserHeaderProps extends HTMLAttributes<HTMLDivElement> {
  user: User;
}

const UserHeader = forwardRef<HTMLInputElement, UserHeaderProps>(
  ({ user }, ref) => {
    const router = useRouter();
    const routerState = useRouterState();
    const { theme, setTheme } = useTheme();
    // @todo causes "Maximum update depth exceeded" error
    // const [isProjectSidebarNarrow, setIsProjectSidebarNarrow] = useStore(
    //   (storeState) => [
    //     storeState.isProjectSidebarNarrow,
    //     storeState.setIsProjectSidebarNarrow,
    //   ]
    // );
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
        if (match !== undefined) {
          part = match;
        }

        return {
          part,
          path: `/${path}`,
          full: routerState.location.pathname,
        };
      });

    return (
      <div ref={ref} className="w-full bg-white dark:bg-zinc-900">
        <div
          id="navigation-bar"
          className="flex border-b border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex w-60 shrink-0 border-r border-zinc-200 p-2 dark:border-zinc-800">
            {/* <Button
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
            </Button> */}
          </div>
          <div className="flex flex-auto items-center justify-between p-2">
            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.history.back()}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">__root.buttonNavigateBack</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.history.forward()}
              >
                <ArrowRight className="h-4 w-4" />
                <span className="sr-only">__root.buttonNavigateForward</span>
              </Button>

              <Breadcrumb className="ml-2 flex">
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index, array) => (
                    <Fragment key={crumb.path}>
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link
                            to={crumb.path}
                            className="text-zinc-800 no-underline hover:underline dark:text-zinc-200"
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
                      className="mr-2"
                      name={user.name}
                      src="https://github.com/shadcn.png"
                    />
                    {user.name}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="mt-4 mr-2 w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={async () =>
                        router.navigate({ to: '/user/profile' })
                      }
                    >
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
                              <Sun className="mr-2 h-4 w-4" />
                              Light
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="dark">
                              <Moon className="mr-2 h-4 w-4" />
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
      </div>
    );
  }
);
UserHeader.displayName = 'ProjectHeader';

export { UserHeader };
