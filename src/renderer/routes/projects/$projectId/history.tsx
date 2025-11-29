import {
  HistorySidebar,
  HistorySidebarSkeleton,
} from '@root/src/renderer/components/history-sidebar';
import { useProject } from '@root/src/renderer/hooks/useProject';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import type { ReactElement } from 'react';

export const Route = createFileRoute('/projects/$projectId/history')({
  component: ProjectHistoryLayout,
});

function ProjectHistoryLayout(): ReactElement {
  const {
    projectQuery: { data: project, isPending: isReadingProject },
  } = useProject();

  return (
    <div className="flex h-full">
      {isReadingProject ? (
        <HistorySidebarSkeleton />
      ) : (
        <HistorySidebar project={project} />
      )}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
