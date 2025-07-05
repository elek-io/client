import { TranslatableString } from '@elek-io/core';
import {
  AppSidebar,
  AppSidebarProps,
} from '@renderer/components/ui/app-sidebar';
import { NotificationIntent, useStore } from '@renderer/store';
import { useQuery } from '@tanstack/react-query';
import { Outlet, createFileRoute, useRouter } from '@tanstack/react-router';
import {
  History,
  Image,
  Layers,
  LayoutDashboard,
  Settings,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/projects/$projectId')({
  beforeLoad: async ({ context, params }) => {
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
      if (toUserLanguage) {
        return toUserLanguage;
      }

      const toProjectsDefaultLanguage =
        project.settings.language.default &&
        record[project.settings.language.default];
      if (toProjectsDefaultLanguage) {
        return toProjectsDefaultLanguage;
      }

      const toEnglish = record['en'];
      if (toEnglish) {
        return toEnglish;
      }

      return `(Missing translation for key "${key}")`;
    }

    const project = await context.core.projects.read({
      id: params.projectId,
    });

    const collections = await context.core.collections.list({
      projectId: params.projectId,
      limit: 0,
    });

    return {
      project,
      collections,
      translateContent,
    };
  },
  component: ProjectLayout,
});

function ProjectLayout(): JSX.Element {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = useStore((state) => state.addNotification);
  const isProjectSidebarNarrow = useStore(
    (state) => state.isProjectSidebarNarrow
  );
  const [isSynchronizing, setIsSynchronizing] = useState(false);
  const projectNavigation: AppSidebarProps['groups'] = [
    {
      title: 'Project',
      items: [
        {
          title: 'Dashboard',
          url: '/projects/$projectId/dashboard',
          icon: LayoutDashboard,
        },
        {
          title: 'Assets',
          url: '/projects/$projectId/assets',
          icon: Image,
        },
        {
          title: 'Collections',
          url: '/projects/$projectId/collections',
          icon: Layers,
        },
        {
          title: 'History',
          url: '/projects/$projectId/history',
          icon: History,
        },
        {
          title: 'Settings',
          url: '/projects/$projectId/settings',
          icon: Settings,
        },
      ],
    },
  ];

  useEffect(() => {
    useStore.setState((prev) => ({
      breadcrumbLookupMap: new Map(prev.breadcrumbLookupMap).set(
        context.project.id,
        context.project.name
      ),
    }));
  }, [context.project]);

  useEffect(() => {
    context.collections.list.map((collection) => {
      useStore.setState((prev) => ({
        breadcrumbLookupMap: new Map(prev.breadcrumbLookupMap).set(
          collection.id,
          context.translateContent(
            'collection.name.plural',
            collection.name.plural
          )
        ),
      }));
    });
  }, [context.collections]);

  const projectChangesQuery = useQuery({
    enabled: context.project.remoteOriginUrl !== null,
    queryKey: ['projectChanges', context.project.id],
    queryFn: async () => {
      const changes = await context.core.projects.getChanges({
        id: context.project.id,
      });
      return changes;
    },
    // Refetch the data every 3 minutes
    refetchInterval: 180000,
  });

  async function onSynchronize(): Promise<void> {
    setIsSynchronizing(true);
    try {
      await context.core.projects.synchronize({
        id: context.project.id,
      });
      setIsSynchronizing(false);
      addNotification({
        intent: NotificationIntent.SUCCESS,
        title: 'Successfully synchronized Project',
        description: 'The Project was successfully synchronized.',
      });
      await projectChangesQuery.refetch();
      // router.invalidate();
    } catch (error) {
      setIsSynchronizing(false);
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to synchronize Project',
        description: 'There was an error synchronizing the Project.',
      });
    }
  }

  return (
    <>
      <AppSidebar electron={context.electron} groups={projectNavigation} />
      <Outlet />
    </>
  );
}
