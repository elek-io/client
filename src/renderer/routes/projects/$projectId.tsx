import { useQuery } from '@tanstack/react-query';
import { Outlet, createFileRoute } from '@tanstack/react-router';

import {
  ProjectSidebar,
  ProjectSidebarSkeleton,
} from '@renderer/components/project-sidebar';
import { ContentTranslationProvider } from '@renderer/providers/ContentTranslationProvider';
import { queryOptions } from '@renderer/queries';

export const Route = createFileRoute('/projects/$projectId')({
  component: ProjectLayout,
});

function ProjectLayout(): React.JSX.Element {
  const { projectId } = Route.useParams();
  const {
    data: project,
    isPending: isProjectPending,
    isError: isProjectError,
    error: projectError,
  } = useQuery(queryOptions.projects.read({ id: projectId }));

  if (isProjectError) {
    throw projectError;
  }

  return (
    <ContentTranslationProvider projectId={projectId}>
      <div className="flex h-full overflow-hidden">
        {isProjectPending ? (
          <ProjectSidebarSkeleton />
        ) : (
          <ProjectSidebar project={project} />
        )}

        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
      </div>
    </ContentTranslationProvider>
  );
}
