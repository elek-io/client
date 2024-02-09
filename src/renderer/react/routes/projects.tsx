import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/projects')({
  component: About,
  loader: ({ context }) => context.core.projects.list(),
});

function About() {
  const projects = Route.useLoaderData();

  return (
    <div className="p-2">
      Hello from Projects page!{' '}
      <ul>
        {projects.list.map((project) => {
          return <li key={project.id}>{project.name}</li>;
        })}
      </ul>
    </div>
  );
}
