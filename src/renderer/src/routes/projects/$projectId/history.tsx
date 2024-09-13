import { CommitHistory } from '@renderer/components/ui/commit-history';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { Sidebar } from '@renderer/components/ui/sidebar';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/projects/$projectId/history')({
  component: ProjectHistoryLayout,
});

function ProjectHistoryLayout(): JSX.Element {
  const context = Route.useRouteContext();

  return (
    <div className="flex h-full">
      <Sidebar>
        <ScrollArea>
          <div className="px-3">
            <CommitHistory
              projectId={context.project.id}
              commits={context.project.fullHistory}
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
