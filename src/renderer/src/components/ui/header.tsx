import { useStore } from '@renderer/store';
import { Link, useRouter, useRouterState } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { forwardRef, Fragment, HTMLAttributes } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from './breadcrumb';
import { Button } from './button';
import { Separator } from './separator';
import { SidebarTrigger } from './sidebar';

export interface HeaderProps extends HTMLAttributes<HTMLDivElement> {}

const Header = forwardRef<HTMLInputElement, HeaderProps>(({ user }, ref) => {
  const router = useRouter();
  const routerState = useRouterState();
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
        path: `/${path}`,
        full: routerState.location.pathname,
      };
    });

  return (
    <header className="sticky top-0 z-10 window-draggable-area flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
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
          <span className="sr-only">{'__root.buttonNavigateForward'}</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => location.reload()}>
          <RefreshCw className="w-4 h-4"></RefreshCw>
          <span className="sr-only">{'__root.buttonNavigateReload'}</span>
        </Button>
        <Separator orientation="vertical" className="h-4 mr-2" />
        <Breadcrumb className="flex ml-2">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index, array) => (
              <Fragment key={crumb.path}>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      to={crumb.path}
                      className={`text-zinc-800 dark:text-zinc-200 no-underline hover:text-foreground ${array.length === index + 1 ? '!underline' : ''}`}
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
    </header>
  );
});
Header.displayName = 'Header';

export { Header };
