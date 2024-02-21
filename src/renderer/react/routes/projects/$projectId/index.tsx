import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/projects/$projectId/')({
  component: ProjectDashboardPage,
  loader: ({ context, params }) =>
    context.core.projects.read({ id: params.projectId }),
});

function ProjectDashboardPage() {
  const project = Route.useLoaderData();

  return <div className="p-2">Dashboard for Project "{project.name}"</div>;
}
