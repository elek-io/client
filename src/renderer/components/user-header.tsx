import { useQuery } from '@tanstack/react-query';
import { Link, useRouter, useRouterState } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Fragment } from 'react/jsx-runtime';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@renderer/components/ui/breadcrumb';
import { Button } from '@renderer/components/ui/button';
import { queryOptions } from '@renderer/queries';
import { useStore } from '@renderer/store';

import { UserDropdown, UserDropdownSkeleton } from './user-dropdown';

export function UserHeader(): React.JSX.Element {
  const router = useRouter();
  const routerState = useRouterState();
  const {
    data: user,
    isPending: isUserPending,
    isError: isUserError,
    error: userError,
  } = useQuery(queryOptions.user.get());
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

  if (isUserError) {
    throw userError;
  }

  return (
    <div className="w-full bg-sidebar">
      <div id="navigation-bar" className="flex border-b">
        <div className="flex w-60 shrink-0 border-r p-2">
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
            {isUserPending ? (
              <UserDropdownSkeleton />
            ) : user === null ? null : (
              <UserDropdown user={user} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
