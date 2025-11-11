import type { UseQueryResult } from '@tanstack/react-query';
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
import React from 'react';

import { ProjectSwitcher } from '@renderer/components/project-switcher';
import { Button } from '@renderer/components/ui/button';
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from '@renderer/components/ui/button-group';
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

import type { GitCommit, Project } from '@elek-io/core';

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

export function ProjectSidebar({
  project,
  projectChangesQuery,
  isSynchronizing,
  onSynchronize,
}: {
  project: Project;
  projectChangesQuery: UseQueryResult<{
    ahead: GitCommit[];
    behind: GitCommit[];
  }>;
  isSynchronizing: boolean;
  onSynchronize: () => Promise<void>;
}): React.JSX.Element {
  return (
    <Sidebar>
      <SidebarHeader>
        <ProjectSwitcher project={project} />
      </SidebarHeader>
      <SidebarContent>
        {project.remoteOriginUrl && (
          <SidebarGroup>
            <ButtonGroup className="w-full">
              <Button
                className="flex-1"
                onClick={onSynchronize}
                isLoading={isSynchronizing}
                disabled={
                  projectChangesQuery.isFetching ||
                  isSynchronizing ||
                  projectChangesQuery.data === undefined ||
                  (projectChangesQuery.data.ahead.length === 0 &&
                    projectChangesQuery.data.behind.length === 0)
                }
                Icon={ArrowDownUp}
              >
                Synchronize
              </Button>
              <ButtonGroupSeparator />
              <Button
                onClick={() => projectChangesQuery.refetch()}
                disabled={projectChangesQuery.isFetching || isSynchronizing}
                Icon={RefreshCw}
              />
            </ButtonGroup>
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
          </SidebarGroup>
        )}
        <SidebarGroup>
          <SidebarGroupLabel>Project</SidebarGroupLabel>
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
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}
