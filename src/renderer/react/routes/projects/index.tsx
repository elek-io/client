import { Link, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/projects/')({
  component: ListProjectsPage,
  loader: ({ context }) => context.core.projects.list(),
});

function ListProjectsPage() {
  const context = Route.useRouteContext();
  const projects = Route.useLoaderData();

  function createProject() {
    context.core.projects.create({ name: 'A test project' });
  }

  return (
    <div className="p-2">
      <button onClick={createProject}>Create new Project</button>
      Found the following Projects:{' '}
      <ul>
        {projects.list.map((project) => {
          return (
            <li key={project.id}>
              <Link
                to="/projects/$projectId"
                params={{ projectId: project.id }}
              >
                {project.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
