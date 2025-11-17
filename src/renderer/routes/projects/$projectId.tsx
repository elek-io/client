import { useQuery } from '@tanstack/react-query';
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { type ReactElement, useEffect, useState } from 'react';

import { ProjectSidebar } from '@renderer/components/project-sidebar';
import { queryClient, queryOptions } from '@renderer/queries';
import { useStore } from '@renderer/store';

import { type TranslatableString } from '@elek-io/core';

export const Route = createFileRoute('/projects/$projectId')({
  beforeLoad: async ({ context, params }) => {
    const project = await queryClient.ensureQueryData(
      queryOptions.projects.read({ id: params.projectId })
    );

    /**
     * Returns given TranslatableString in the language of the current user
     *
     * If the current users translation is not available,
     * it shows it in the default language of the project.
     * If this is not available either, show the 'en' value.
     * If this is also not available, show the key instead along with a note,
     * that a translation should be added.
     */
    function translateContent(key: string, record: TranslatableString): string {
      const toUserLanguage = record[context.user.language];
      if (toUserLanguage !== undefined) {
        return toUserLanguage;
      }

      const toProjectsDefaultLanguage =
        record[project.settings.language.default];
      if (toProjectsDefaultLanguage !== undefined) {
        return toProjectsDefaultLanguage;
      }

      const toEnglish = record['en'];
      if (toEnglish !== undefined) {
        return toEnglish;
      }

      return `(Missing translation for key "${key}")`;
    }

    return {
      project,
      translateContent,
    };
  },
  component: ProjectLayout,
});

function ProjectLayout(): ReactElement {
  const context = Route.useRouteContext();
  const addNotification = useStore((state) => state.addNotification);
  const [isSynchronizing, setIsSynchronizing] = useState(false);
  const projectChangesQuery = useQuery(
    queryOptions.projects.getChanges(context.project)
  );
  // const  = useQuery(
  //   queryOptions.projects.(context.project)
  // );

  useEffect(() => {
    useStore.setState((prev) => ({
      breadcrumbLookupMap: new Map(prev.breadcrumbLookupMap).set(
        context.project.id,
        context.project.name
      ),
    }));
  }, [context.project]);

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

  async function onSynchronize(): Promise<void> {
    setIsSynchronizing(true);
    try {
      await context.core.projects.synchronize({
        id: context.project.id,
      });
      setIsSynchronizing(false);
      addNotification({
        intent: 'success',
        title: 'Successfully synchronized Project',
        description: 'The Project was successfully synchronized.',
      });
      await projectChangesQuery.refetch();
      // router.invalidate();
    } catch (error) {
      setIsSynchronizing(false);
      await context.core.logger.error({
        source: 'desktop',
        message: 'Failed to synchronize Project',
        meta: { error },
      });
      addNotification({
        intent: 'danger',
        title: 'Failed to synchronize Project',
        description: 'There was an error synchronizing the Project.',
      });
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      <ProjectSidebar
        project={context.project}
        projectChangesQuery={projectChangesQuery}
        isSynchronizing={isSynchronizing}
        onSynchronize={onSynchronize}
      />

      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>

      {/* <Sidebar isNarrow={isProjectSidebarNarrow}>
        {!isProjectSidebarNarrow && (
          <>
            <div className="flex shrink-0 flex-col p-4">
              <div className="flex items-center">
                <div className="">
                  <FolderGit2 className="h-8 w-8" />
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
                <Link to="/projects" className="text-xs">
                  Change Project
                </Link>
              </div>
            </div>
            {context.project.remoteOriginUrl !== null ? (
              <>
                <div className="flex flex-col p-4 pt-0">
                  <div className="flex">
                    <Button
                      className="flex-1 rounded-r-none"
                      onClick={onSynchronize}
                      isLoading={isSynchronizing}
                      disabled={
                        projectChangesQuery.isFetching ||
                        isSynchronizing ||
                        projectChangesQuery.data === undefined ||
                        (projectChangesQuery.data.ahead.length === 0 &&
                          projectChangesQuery.data.behind.length === 0)
                      }
                    >
                      <ArrowDownUp className="mr-2 h-4 w-4" />
                      Synchronize
                    </Button>
                    <Button
                      className="ml-0.5 rounded-l-none"
                      onClick={async () => projectChangesQuery.refetch()}
                      disabled={
                        projectChangesQuery.isFetching || isSynchronizing
                      }
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="mt-2 text-center text-xs font-medium text-zinc-400">
                    {projectChangesQuery.isFetching ? (
                      'Loading'
                    ) : (
                      <span className="flex items-center justify-center">
                        <DownloadCloud className="mr-1 h-4 w-4" />
                        {projectChangesQuery.data?.behind.length}
                        <UploadCloud className="mr-1 ml-4 h-4 w-4" />
                        {projectChangesQuery.data?.ahead.length}
                      </span>
                    )}
                  </p>

                  {projectChangesQuery.data
                    ? projectChangesQuery.data.ahead.map((commit) => (
                        <Commit
                          key={commit.hash}
                          commit={commit}
                          language={context.user.language}
                        />
                      ))
                    : null}
                </div>
              </>
            ) : null}
          </>
        )}

        <ScrollArea className="border-t border-zinc-200 dark:border-zinc-800">
          <SidebarNavigation>
            {isProjectSidebarNarrow ? (
              <SidebarNavigationItem
                onClick={async () => router.navigate({ to: '/projects' })}
              >
                <FolderOutput className="h-6 w-6" aria-hidden="true" />
              </SidebarNavigationItem>
            ) : null}

            {projectNavigation.map((navigation) => {
              const item = (
                <SidebarNavigationItem to={navigation.to}>
                  <navigation.icon className="h-6 w-6" aria-hidden="true" />
                  {!isProjectSidebarNarrow && (
                    <span className="ml-4">{navigation.name}</span>
                  )}
                </SidebarNavigationItem>
              );

              if (isProjectSidebarNarrow) {
                return (
                  <TooltipProvider key={navigation.name}>
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
      </Sidebar> */}
    </div>
  );
}
