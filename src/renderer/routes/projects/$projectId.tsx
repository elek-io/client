import { Outlet, createFileRoute } from '@tanstack/react-router';

import { ProjectSidebar } from '@renderer/components/project-sidebar';
import { useBreadcrumb } from '@renderer/hooks/useBreadcrumb';
import { useProject } from '@renderer/hooks/useProject';
import { ProjectProvider } from '@renderer/providers/ProjectProvider';

export const Route = createFileRoute('/projects/$projectId')({
  component: ProjectLayout,
});

function ProjectLayoutContent(): React.JSX.Element {
  const {
    projectQuery: { data: project, isPending: isReadingProject },
  } = useProject();
  useBreadcrumb(Route, isReadingProject === false ? project.name : undefined);

  return (
    <div className="flex h-full overflow-hidden">
      <ProjectSidebar />
      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}

function ProjectLayout(): React.JSX.Element {
  const { projectId } = Route.useParams();

  return (
    <ProjectProvider projectId={projectId}>
      <ProjectLayoutContent />
    </ProjectProvider>
  );
}
