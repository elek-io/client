import { SearchResult } from '@elek-io/shared';
import { NotificationIntent } from '@elek-io/ui';
import {
  Cog6ToothIcon,
  FolderOpenIcon,
  HomeIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/20/solid';
import { Link, Outlet, createFileRoute } from '@tanstack/react-router';
import { ChangeEvent, useState } from 'react';
import { useStore } from '../../store';

export const Route = createFileRoute('/projects/$projectId')({
  beforeLoad: async ({ context, params }) => {
    const currentProject = await context.core.projects.read({
      id: params.projectId,
    });

    return { currentProject };
  },
  component: ProjectLayout,
});

function ProjectLayout() {
  const addNotification = useStore((state) => state.addNotification);
  const context = Route.useRouteContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult[]>();
  const projectNavigation = [
    {
      name: 'Dashboard',
      to: '/projects/$projectId/dashboard',
      icon: HomeIcon,
    },
    {
      name: 'Settings',
      to: '/projects/$projectId/settings',
      icon: Cog6ToothIcon,
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
      <aside className="w-72 flex flex-col flex-shrink-0 bg-zinc-900 border-r border-zinc-800">
        <div className="flex flex-shrink-0 flex-col shadow-inner p-4">
          <div className="flex items-center">
            <div className="">
              <FolderOpenIcon className="w-8 h-8" />
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
        <div className="flex flex-1 flex-col overflow-y-auto py-4">
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
          <nav className="flex-1" aria-label="Sidebar">
            <div className="space-y-1 px-2">
              {projectNavigation.map((navigation) => (
                <Link
                  to={navigation.to}
                  className="group flex items-center px-2 py-2 text-sm no-underline border border-transparent rounded-md hover:bg-zinc-800 hover:text-zinc-200"
                  activeProps={{
                    className: 'bg-zinc-800 text-zinc-200 border-zinc-700',
                  }}
                  inactiveProps={{ className: 'text-zinc-400' }}
                >
                  <navigation.icon
                    className="mr-4 h-6 w-6"
                    aria-hidden="true"
                  ></navigation.icon>
                  {navigation.name}
                </Link>
              ))}
              <strong className="px-3 text-sm font-medium">Collections</strong>
              {/* {context.currentProject.} */}
            </div>
          </nav>
        </div>
      </aside>
      <main className="flex flex-1 flex-col overflow-y-auto shadow-inner">
        <Outlet></Outlet>
      </main>
    </div>
  );
}
