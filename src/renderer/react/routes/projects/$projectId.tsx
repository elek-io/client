import { SearchResult, TranslatableString } from '@elek-io/shared';
import { NotificationIntent } from '@elek-io/ui';
import {
  Link,
  Outlet,
  ToPathOption,
  createFileRoute,
  useRouter,
} from '@tanstack/react-router';
import {
  FolderGit2,
  FolderOutput,
  Image,
  Layers,
  LayoutDashboard,
  LucideIcon,
  Search,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../../components/ui/badge';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../components/ui/command';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Sidebar } from '../../components/ui/sidebar';
import { SidebarNavigation } from '../../components/ui/sidebar-navigation';
import { SidebarNavigationItem } from '../../components/ui/sidebar-navigation-item';
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
      return `(Missing translation for key "${key}")`;
    }

    return { currentProject, translate };
  },
  component: ProjectLayout,
});

function ProjectLayout() {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = context.store((state) => state.addNotification);
  const isProjectSidebarNarrow = context.store(
    (state) => state.isProjectSidebarNarrow
  );
  const [isProjectSearchDialogOpen, setProjectSearchDialogOpen] = context.store(
    (state) => [
      state.isProjectSearchDialogOpen,
      state.setProjectSearchDialogOpen,
    ]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult[]>([]);
  const projectNavigation: {
    name: string;
    to: ToPathOption;
    icon: LucideIcon;
  }[] = [
    {
      name: 'Dashboard',
      to: '/projects/$projectId/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Assets',
      to: '/projects/$projectId/assets',
      icon: Image,
    },
    {
      name: 'Collections',
      to: '/projects/$projectId/collections',
      icon: Layers,
    },
    {
      name: 'Settings',
      to: '/projects/$projectId/settings',
      icon: Settings,
    },
  ];

  async function onSearch(value: string) {
    setSearchQuery(value);
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
      <Sidebar isNarrow={isProjectSidebarNarrow}>
        {!isProjectSidebarNarrow && (
          <div className="flex flex-shrink-0 flex-col p-4">
            <div className="flex items-center">
              <div className="">
                <FolderGit2 className="w-8 h-8" />
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
              <Link to={'/projects'} className="text-xs">
                Change Project
              </Link>
            </div>
          </div>
        )}

        <ScrollArea>
          <SidebarNavigation>
            {isProjectSidebarNarrow && (
              <SidebarNavigationItem
                onClick={() => router.navigate({ to: '/projects' })}
              >
                <FolderOutput
                  className="h-6 w-6"
                  aria-hidden="true"
                ></FolderOutput>
                {!isProjectSidebarNarrow && (
                  <span className="ml-4">Change Project</span>
                )}
              </SidebarNavigationItem>
            )}

            <SidebarNavigationItem
              onClick={() => setProjectSearchDialogOpen(true)}
            >
              <Search className="h-6 w-6" aria-hidden="true"></Search>
              {!isProjectSidebarNarrow && <span className="ml-4">Search</span>}
            </SidebarNavigationItem>

            {projectNavigation.map((navigation) => {
              const item = (
                <SidebarNavigationItem key={navigation.to} to={navigation.to}>
                  <navigation.icon
                    className="h-6 w-6"
                    aria-hidden="true"
                  ></navigation.icon>
                  {!isProjectSidebarNarrow && (
                    <span className="ml-4">{navigation.name}</span>
                  )}
                </SidebarNavigationItem>
              );

              if (isProjectSidebarNarrow) {
                return (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>{item}</TooltipTrigger>
                      <TooltipContent side="right" align="center">
                        <p>{navigation.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              }

              return item;
            })}
          </SidebarNavigation>
        </ScrollArea>
      </Sidebar>

      <div className="flex flex-1 flex-col">
        <Outlet></Outlet>
      </div>

      <CommandDialog
        open={isProjectSearchDialogOpen}
        onOpenChange={setProjectSearchDialogOpen}
      >
        <CommandInput
          placeholder="Type a command or search..."
          value={searchQuery}
          onValueChange={(value) => onSearch(value)}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Assets">
            {searchResult
              .filter((result) => result.type === 'asset')
              .map((result) => {
                return (
                  <CommandItem
                    onClick={() =>
                      router.navigate({ to: '/projects/$projectId/assets' })
                    }
                    key={result.id}
                  >
                    <Badge className="mr-2">{result.language}</Badge>
                    {result.name}
                  </CommandItem>
                );
              })}
          </CommandGroup>

          <CommandGroup heading="Collections">
            {searchResult
              .filter((result) => result.type === 'collection')
              .map((result) => {
                return (
                  <CommandItem
                    onClick={() =>
                      router.navigate({
                        to: '/projects/$projectId/collections',
                      })
                    }
                    key={result.id}
                  >
                    <Badge className="mr-2">{result.language}</Badge>
                    {result.name}
                  </CommandItem>
                );
              })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
