import { CommitHistory } from '@renderer/components/ui/commit-history';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { Sidebar } from '@renderer/components/ui/sidebar';
import { projectQueryOptions } from '@renderer/queries';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/projects/$projectId/history')({
  component: ProjectHistoryLayout,
});

function ProjectHistoryLayout(): JSX.Element {
  const context = Route.useRouteContext();
  const { projectId } = Route.useParams();
  const projectQuery = useQuery(projectQueryOptions({ id: projectId }));

  return (
    <div className="flex h-full">
      <Sidebar>
        <ScrollArea>
          <div className="px-3">
            <CommitHistory
              projectId={projectQuery.data?.id}
              commits={projectQuery.data?.fullHistory}
              language={context.user.language}
            />
          </div>
        </ScrollArea>
      </Sidebar>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Outlet></Outlet>
      </div>
    </div>
  );
}
