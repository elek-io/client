import React from 'react';

import {
  CommitHistory,
  CommitHistorySkeleton,
} from '@renderer/components/commit-history';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@renderer/components/ui/sidebar';
import { useQueryNoError } from '@renderer/hooks/useQueryNoError';
import { queryOptions } from '@renderer/queries';

import type { Project } from '@elek-io/core';

export function HistorySidebar({
  project,
}: {
  project: Project;
}): React.JSX.Element {
  const { data: history } = useQueryNoError(
    queryOptions.projects.history({ id: project.id })
  );

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Changes</SidebarGroupLabel>
          <SidebarGroupContent>
            {history === undefined ? (
              <SidebarMenu>
                <CommitHistorySkeleton />
              </SidebarMenu>
            ) : history.fullHistory.length > 0 ? (
              <CommitHistory
                projectId={project.id}
                commits={history.fullHistory}
              />
            ) : (
              <p className="px-3 text-sm">No Changes found</p>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}

export function HistorySidebarSkeleton(): React.JSX.Element {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Changes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <CommitHistorySkeleton />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
