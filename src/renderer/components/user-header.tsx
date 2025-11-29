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
import { useStore } from '@renderer/store';

import { useUser } from '../hooks/useUser';
import { ButtonGroup } from './ui/button-group';
import { UserDropdown, UserDropdownSkeleton } from './user-dropdown';

export function UserHeader(): React.JSX.Element {
  const router = useRouter();
  const routerState = useRouterState();
  const {
    userQuery: {
      data: user,
      isPending: isUserPending,
      isError: isUserError,
      error: userError,
    },
  } = useUser();
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
    <div className="flex w-full border-b bg-sidebar">
      <div className="flex w-60 shrink-0 border-r p-2" />
      <div className="flex flex-1 items-center p-1">
        <div className="flex flex-1 items-center">
          <ButtonGroup>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.history.back()}
              Icon={ArrowLeft}
            >
              <span className="sr-only">__root.buttonNavigateBack</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.history.forward()}
              Icon={ArrowRight}
            >
              <span className="sr-only">__root.buttonNavigateForward</span>
            </Button>
          </ButtonGroup>

          <Breadcrumb className="ml-4 flex flex-1">
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index, array) => (
                <Fragment key={crumb.path}>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={crumb.path}>{crumb.part}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {array.length !== index + 1 && <BreadcrumbSeparator />}
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        {isUserPending ? (
          <UserDropdownSkeleton />
        ) : user === null ? null : (
          <UserDropdown user={user} />
        )}
      </div>
    </div>
  );
}
