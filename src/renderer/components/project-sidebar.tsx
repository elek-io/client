import { useMutation } from '@tanstack/react-query';
import { Link, type ToPathOption } from '@tanstack/react-router';
import {
  Layers,
  LayoutDashboard,
  Settings,
  Image,
  History,
  type LucideIcon,
  ArrowDownUp,
  RefreshCw,
  DownloadCloud,
  UploadCloud,
} from 'lucide-react';
import React, { useState } from 'react';

import {
  ProjectSwitcher,
  ProjectSwitcherSkeleton,
} from '@renderer/components/project-switcher';
import { Button } from '@renderer/components/ui/button';
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from '@renderer/components/ui/button-group';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@renderer/components/ui/dialog';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@renderer/components/ui/sidebar';
import { useProject } from '@renderer/hooks/useProject';
import { useQueryNoError } from '@renderer/hooks/useQueryNoError';
import { queryOptions } from '@renderer/queries';

const projectNavigation: {
  name: string;
  to: ToPathOption; // @todo fix type
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

function ProjectNavigation(): React.JSX.Element {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {projectNavigation.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild>
                <Link to={item.to} activeProps={{ 'data-active': true }}>
                  <item.icon />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function ProjectSidebar(): React.JSX.Element {
  const {
    projectQuery: { data: project, isPending: isReadingProject },
  } = useProject();
  const {
    data: projectChanges,
    isFetching: isFetchingProjectChanges,
    refetch: refetchProjectChanges,
  } = useQueryNoError(queryOptions.projects.getChanges(project));
  const { mutateAsync: synchronizeProject, isPending: isSynchronizingProject } =
    useMutation({
      ...queryOptions.projects.synchronize,
      // We handle a failed sync in place with the dialog below instead of showing
      // the root error boundary. Core rejects a sync that would push a dangling
      // reference (and other conflicts) without pushing anything.
      throwOnError: false,
      onError: () => {
        // Prevents the error toast from showing up too
      },
    });

  const [isSyncConflictDialogOpen, setIsSyncConflictDialogOpen] =
    useState(false);

  if (isReadingProject) {
    return <ProjectSidebarSkeleton />;
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <ProjectSwitcher project={project} />
      </SidebarHeader>
      <SidebarContent>
        {project.remoteOriginUrl != null ? (
          <SidebarGroup>
            <ButtonGroup className="w-full">
              <Button
                className="flex-1"
                onClick={async () => {
                  try {
                    await synchronizeProject({ id: project.id });
                  } catch {
                    // A conflict (e.g. a rebase that orphans a reference) stops
                    // the sync before it pushes. Surface it in place rather than
                    // crashing to the error boundary.
                    setIsSyncConflictDialogOpen(true);
                  }
                }}
                isLoading={isSynchronizingProject}
                disabled={
                  isFetchingProjectChanges ||
                  isSynchronizingProject ||
                  projectChanges === undefined ||
                  (projectChanges.ahead.length === 0 &&
                    projectChanges.behind.length === 0)
                }
                Icon={ArrowDownUp}
              >
                Synchronize
              </Button>
              <ButtonGroupSeparator />
              <Button
                onClick={async () => await refetchProjectChanges()}
                disabled={isFetchingProjectChanges || isSynchronizingProject}
                Icon={RefreshCw}
              />
            </ButtonGroup>
            <p className="mt-2 text-center text-xs font-medium text-zinc-400">
              {isFetchingProjectChanges ? (
                'Loading'
              ) : (
                <span className="flex items-center justify-center">
                  <DownloadCloud className="mr-1 h-4 w-4" />
                  {projectChanges?.behind.length}
                  <UploadCloud className="mr-1 ml-4 h-4 w-4" />
                  {projectChanges?.ahead.length}
                </span>
              )}
            </p>

            <Dialog
              open={isSyncConflictDialogOpen}
              onOpenChange={setIsSyncConflictDialogOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Could not synchronize this Project</DialogTitle>
                  <DialogDescription>
                    A conflict stopped the synchronization before anything was
                    pushed, so nothing reached the remote and your local changes
                    are safe. Resolve the conflict and try again.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      Close
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </SidebarGroup>
        ) : null}
        <ProjectNavigation />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}

export function ProjectSidebarSkeleton(): React.JSX.Element {
  return (
    <Sidebar>
      <SidebarHeader>
        <ProjectSwitcherSkeleton />
      </SidebarHeader>
      <SidebarContent>
        <ProjectNavigation />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
