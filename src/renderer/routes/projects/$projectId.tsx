import { ProjectProvider } from '@root/src/renderer/providers/ProjectProvider';
import { Outlet, createFileRoute } from '@tanstack/react-router';

import { ProjectSidebar } from '@renderer/components/project-sidebar';

export const Route = createFileRoute('/projects/$projectId')({
  component: ProjectLayout,
});

function ProjectLayout(): React.JSX.Element {
  const { projectId } = Route.useParams();

  return (
    <ProjectProvider projectId={projectId}>
      <div className="flex h-full overflow-hidden">
        <ProjectSidebar />
        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
      </div>
    </ProjectProvider>
  );
}
