import { Project, SearchResult, User } from '@elek-io/shared';
import {
  BaseLayout,
  Breadcrumbs,
  NotificationIntent,
  NotificationProps,
} from '@elek-io/ui';
import { SidebarNavigationItemGroup } from '@elek-io/ui/dist/components/Sidebar';
import {
  Outlet,
  createRootRouteWithContext,
  redirect,
  useRouterState,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { ChangeEvent, useState } from 'react';
import { ContextBridgeApi } from '../../preload';

interface RouterContext {
  core: ContextBridgeApi['core'];
}

// Use the routerContext to create your root route
export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context, location }) => {
    const user = await context.core.user.get();
    if (!user) {
      throw redirect({
        to: '/user/set',
        search: {
          redirect: location.href,
        },
      });
    }
    return { currentUser: user };
  },
  component: RootRoute,
});

function RootRoute() {
  const router = useRouterState();
  const context = Route.useRouteContext();
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumbs>([]);
  const [currentUser, setCurrentUser] = useState<User>(context.currentUser);
  const [currentProject, setCurrentProject] = useState<Project>();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult[]>();
  const sidebarDisabledOnPaths = ['/', '/projects', '/projects/create'];
  const [sidebarNavigation, setSidebarNavigation] = useState<
    SidebarNavigationItemGroup[]
  >([]);

  function addNotification(notification: NotificationProps) {
    setNotifications([...notifications, notification]);
  }

  async function onSearch(event: ChangeEvent<HTMLInputElement>) {
    setSearchQuery(event.target.value);
    if (!currentProject) {
      return;
    }

    try {
      const searchResult = await context.core.projects.search(
        currentProject.id,
        searchQuery
      );
      setSearchResult(searchResult);
      console.log('Searched: ', {
        query: searchQuery,
        result: searchResult,
      });
    } catch (error) {
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Search failed',
        description: 'There was an error searching for the provided query.',
      });
    }
  }

  return (
    <BaseLayout
      currentPath={router.location.pathname}
      currentUser={currentUser}
      currentProject={currentProject}
      notifications={notifications}
      onSearch={(event) => onSearch(event)}
      sidebarDisabledOnPaths={sidebarDisabledOnPaths}
      sidebarNavigation={sidebarNavigation}
      userNavigation={[]}
      searchQuery={searchQuery}
    >
      <Outlet></Outlet>
      <TanStackRouterDevtools />
    </BaseLayout>
  );
}
