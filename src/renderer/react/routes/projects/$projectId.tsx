import { SearchResult, TranslatableString } from '@elek-io/shared';
import { NotificationIntent } from '@elek-io/ui';
import {
  BackpackIcon,
  DashboardIcon,
  GearIcon,
  ImageIcon,
  LayersIcon,
  MagnifyingGlassIcon,
} from '@radix-ui/react-icons';
import { Link, Outlet, createFileRoute } from '@tanstack/react-router';
import { ChangeEvent, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';

export const Route = createFileRoute('/projects/$projectId')({
  beforeLoad: async ({ context, params }) => {
    const currentProject = await context.core.projects.read({
      id: params.projectId,
    });

    /**
     * Returns given TranslatableString in the language of the current user
     *
     * If the current users translation is not available,
     * it shows it in the default language of the project.
     * If this is not available either, show the 'en' value.
     * If this is also not available, show the key instead along with a note,
     * that a translation should be added.
     */
    function translate(key: string, record: TranslatableString): string {
      const toCurrentUserLocale = record[context.currentUser.locale.id];
      if (toCurrentUserLocale) {
        return toCurrentUserLocale;
      }
      const toCurrentProjectsDefaultLocale =
        currentProject.settings.locale.default.id &&
        record[currentProject.settings.locale.default.id];
      if (toCurrentProjectsDefaultLocale) {
        return toCurrentProjectsDefaultLocale;
      }
      const toEnglish = record['en'];
      if (toEnglish) {
        return toEnglish;
      }
      return `Missing translation for key "${key}"`;
    }

    return { currentProject, translate };
  },
  component: ProjectLayout,
});

function ProjectLayout() {
  const context = Route.useRouteContext();
  const addNotification = context.store((state) => state.addNotification);
  const isProjectSidebarNarrow = context.store(
    (state) => state.isProjectSidebarNarrow
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult[]>();
  const projectNavigation = [
    {
      name: 'Dashboard',
      to: '/projects/$projectId/dashboard',
      icon: DashboardIcon,
    },
    {
      name: 'Assets',
      to: '/projects/$projectId/assets',
      icon: ImageIcon,
    },
    {
      name: 'Collections',
      to: '/projects/$projectId/collections',
      icon: LayersIcon,
    },
    {
      name: 'Settings',
      to: '/projects/$projectId/settings',
      icon: GearIcon,
    },
  ];

  async function onSearch(event: ChangeEvent<HTMLInputElement>) {
    setSearchQuery(event.target.value);
    try {
      const searchResult = await context.core.projects.search(
        context.currentProject.id,
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
    <div className="flex h-full overflow-hidden">
      <aside
        className={`flex flex-col flex-shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 ${
          isProjectSidebarNarrow === true ? 'w-18' : 'w-60'
        }`}
      >
        {!isProjectSidebarNarrow && (
          <div className="flex flex-shrink-0 flex-col p-4">
            <div className="flex items-center">
              <div className="">
                <BackpackIcon className="w-8 h-8" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium group-hover:text-gray-900">
                  {context.currentProject.name}
                </p>
                <p className="text-xs font-medium text-zinc-400 group-hover:text-gray-700">
                  Version {context.currentProject.version}
                </p>
              </div>
            </div>
            <div className="ml-11">
              <a href="/projects">
                <Link to={'/projects'} className="text-xs">
                  Change Project
                </Link>
              </a>
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col overflow-y-auto py-4">
          {!isProjectSidebarNarrow && (
            <form className="flex" action="#" method="GET">
              <label htmlFor="search-field" className="sr-only">
                Search all files
              </label>
              <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
                  <MagnifyingGlassIcon
                    className="h-5 w-5 flex-shrink-0"
                    aria-hidden="true"
                  />
                </div>
                <input
                  name="search"
                  className="h-full w-full border-transparent py-2 pl-8 pr-3 text-base text-gray-900 placeholder-gray-500 focus:border-transparent focus:placeholder-gray-400 focus:outline-none focus:ring-0"
                  placeholder="Search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => onSearch(event)}
                />
              </div>
            </form>
          )}
          <nav className="flex-1" aria-label="Sidebar">
            <div className="space-y-1 px-2">
              {projectNavigation.map((navigation) => {
                const link = (
                  <Link
                    to={navigation.to}
                    className="group flex items-center px-2 py-2 text-sm no-underline border border-transparent rounded-md hover:bg-zinc-800 hover:text-zinc-200"
                    activeProps={{
                      className: 'bg-zinc-800 text-zinc-200 border-zinc-700',
                    }}
                    inactiveProps={{ className: 'text-zinc-400' }}
                  >
                    <navigation.icon
                      className="h-6 w-6"
                      aria-hidden="true"
                    ></navigation.icon>
                    {!isProjectSidebarNarrow && (
                      <span className="ml-4">{navigation.name}</span>
                    )}
                  </Link>
                );

                if (isProjectSidebarNarrow) {
                  return (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right" align="center">
                          <p>{navigation.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }

                return link;
              })}
            </div>
          </nav>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-y-auto shadow-inner">
        <Outlet></Outlet>
      </div>
    </div>
  );
}
