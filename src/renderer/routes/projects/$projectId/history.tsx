import { createFileRoute, Outlet } from '@tanstack/react-router';
import type { ReactElement } from 'react';

import {
  HistorySidebar,
  HistorySidebarSkeleton,
} from '@renderer/components/history-sidebar';
import { useBreadcrumb } from '@renderer/hooks/useBreadcrumb';
import { useProject } from '@renderer/hooks/useProject';

export const Route = createFileRoute('/projects/$projectId/history')({
  component: ProjectHistoryLayout,
});

function ProjectHistoryLayout(): ReactElement {
  const { projectId } = Route.useParams();
  useBreadcrumb(Route, 'History');
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
