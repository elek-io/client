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

import type { Project } from '@elek-io/core';

export function HistorySidebar({
  project,
}: {
  project: Project;
}): React.JSX.Element {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Changes</SidebarGroupLabel>
          <SidebarGroupContent>
            {project.fullHistory.length > 0 ? (
              <CommitHistory
                projectId={project.id}
                commits={project.fullHistory}
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
