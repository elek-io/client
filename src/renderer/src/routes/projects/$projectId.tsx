import { SynchronizeProjectProps, TranslatableString } from '@elek-io/core';
import { Button } from '@renderer/components/ui/button';
import { Commit } from '@renderer/components/ui/commit';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { Sidebar } from '@renderer/components/ui/sidebar';
import { SidebarNavigation } from '@renderer/components/ui/sidebar-navigation';
import { SidebarNavigationItem } from '@renderer/components/ui/sidebar-navigation-item';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { ipc } from '@renderer/ipc';
import {
  projectChangesQueryOptions,
  projectQueryOptions,
} from '@renderer/queries';
import { NotificationIntent, useStore } from '@renderer/store';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Link,
  Outlet,
  ToPathOption,
  createFileRoute,
  useRouter,
} from '@tanstack/react-router';
import {
  ArrowDownUp,
  DownloadCloud,
  FolderGit2,
  FolderOutput,
  History,
  Image,
  Layers,
  LayoutDashboard,
  LucideIcon,
  RefreshCw,
  Settings,
  UploadCloud,
} from 'lucide-react';

export const Route = createFileRoute('/projects/$projectId')({
  beforeLoad: async ({ context, params }) => {
    const project = await context.queryClient.fetchQuery(
      projectQueryOptions({ id: params.projectId })
    );

    /**
     * Returns given TranslatableString into the language of the current user
     *
     * If the current users translation is not available,
     * it shows it in the default language of the project.
     * If this is not available either, show the 'en' value.
     * If this is also not available, show the key instead
     */
    function translateContent(key: string, record: TranslatableString): string {
      if (context.user) {
        const toUserLanguage = record[context.user.language];
        if (toUserLanguage) {
          return toUserLanguage;
        }
      }

      const toProjectsDefaultLanguage =
        record[project.settings.language.default];
      if (toProjectsDefaultLanguage) {
        return toProjectsDefaultLanguage;
      }

      const toEnglish = record['en'];
      if (toEnglish) {
        return toEnglish;
      }

      return key;
    }

    return { project, translateContent };
  },
  component: ProjectLayout,
});

function ProjectLayout(): JSX.Element {
  const router = useRouter();
  const context = Route.useRouteContext();
  const { projectId } = Route.useParams();
  const projectQuery = useQuery(projectQueryOptions({ id: projectId }));
  const projectChangesQuery = useQuery(
    projectChangesQueryOptions(context.project)
  );
  const synchronizeProjectMutation = useMutation({
    mutationFn: (props: SynchronizeProjectProps) =>
      ipc.core.projects.synchronize(props),
    onError: (error) => {
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to synchronize Project',
        description: 'There was an error synchronizing the Project.',
      });
    },
    onSuccess: () => {
      addNotification({
        intent: NotificationIntent.SUCCESS,
        title: 'Successfully synchronized Project',
        description: 'The Project was successfully synchronized.',
      });
      projectQuery.refetch();
      projectChangesQuery.refetch();
    },
  });
  const addNotification = useStore((state) => state.addNotification);
  const isProjectSidebarNarrow = useStore(
    (state) => state.isProjectSidebarNarrow
  );
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
      name: 'History',
      to: '/projects/$projectId/history',
      icon: History,
    },
    {
      name: 'Settings',
      to: '/projects/$projectId/settings',
      icon: Settings,
    },
  ];

  // useEffect(() => {
  //   useStore.setState((prev) => ({
  //     breadcrumbLookupMap: new Map(prev.breadcrumbLookupMap).set(
  //       context.project.id,
  //       context.project.name
  //     ),
  //   }));
  // }, [context.project]);

  // useEffect(() => {
  //   context.collections.list.map((collection) => {
  //     useStore.setState((prev) => ({
  //       breadcrumbLookupMap: new Map(prev.breadcrumbLookupMap).set(
  //         collection.id,
  //         context.translateContent(
  //           'collection.name.plural',
  //           collection.name.plural
  //         )
  //       ),
  //     }));
  //   });
  // }, [context.collections]);

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar isNarrow={isProjectSidebarNarrow}>
        {!isProjectSidebarNarrow && (
          <>
            <div className="flex flex-shrink-0 flex-col p-4">
              <div className="flex items-center">
                <div className="">
                  <FolderGit2 className="w-8 h-8" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium group-hover:text-gray-900">
                    {context.project.name}
                  </p>
                  <p className="text-xs font-medium text-zinc-400 group-hover:text-gray-700">
                    Version {context.project.version}
                  </p>
                </div>
              </div>
              <div className="ml-11">
                <Link to={'/projects'} className="text-xs">
                  Change Project
                </Link>
              </div>
            </div>
            <div className="p-4 pt-0 flex flex-col">
              <div className="flex">
                <Button
                  className="flex-1 rounded-r-none"
                  onClick={() =>
                    synchronizeProjectMutation.mutate({ id: projectId })
                  }
                  isLoading={synchronizeProjectMutation.isPending}
                  disabled={
                    projectQuery.data?.remoteOriginUrl === null ||
                    projectChangesQuery.isLoading ||
                    synchronizeProjectMutation.isPending ||
                    projectChangesQuery.data === undefined ||
                    (projectChangesQuery.data.ahead.length === 0 &&
                      projectChangesQuery.data.behind.length === 0)
                  }
                >
                  <ArrowDownUp className="w-4 h-4 mr-2" />
                  Synchronize
                </Button>
                <Button
                  className="rounded-l-none ml-0.5"
                  onClick={() => projectChangesQuery.refetch()}
                  disabled={
                    projectQuery.data?.remoteOriginUrl === null ||
                    projectChangesQuery.isLoading ||
                    synchronizeProjectMutation.isPending
                  }
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              <p className="mt-2 text-center text-xs font-medium text-zinc-400">
                {projectChangesQuery.isLoading ? (
                  'Loading'
                ) : (
                  <span className="flex items-center justify-center">
                    <DownloadCloud className="w-4 h-4 mr-1" />
                    {projectChangesQuery.data?.behind.length}
                    <UploadCloud className="w-4 h-4 ml-4 mr-1" />
                    {projectChangesQuery.data?.ahead.length}
                  </span>
                )}
              </p>

              {projectChangesQuery.data &&
                projectChangesQuery.data.ahead.map((commit) => (
                  <Commit
                    key={commit.hash}
                    commit={commit}
                    language={context.user.language}
                  />
                ))}
            </div>
          </>
        )}

        <ScrollArea className="border-t border-zinc-200 dark:border-zinc-800">
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

            {projectNavigation.map((navigation) => {
              const item = (
                <SidebarNavigationItem to={navigation.to} key={navigation.to}>
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
                  <TooltipProvider key={navigation.to}>
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
    </div>
  );
}
