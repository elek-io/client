import { createFileRoute } from '@tanstack/react-router';
import { useStore } from '../../../store';

export const Route = createFileRoute('/projects/$projectId/')({
  component: ProjectDashboardPage,
});

function ProjectDashboardPage() {
  const addNotification = useStore((state) => state.addNotification);
  const context = Route.useRouteContext();

  return <div>Dashboard for Project "{context.currentProject.name}"</div>;
}
