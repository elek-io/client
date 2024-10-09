import { ProjectHeader } from '@renderer/components/ui/project-header';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/projects')({
  beforeLoad: async ({ context }) => {
    const user = await context.core.user.get();
    if (!user) {
      throw redirect({
        to: '/user/profile',
      });
    }

    return { user };
  },
  component: ProjectsLayout,
});

function ProjectsLayout(): JSX.Element {
  const { user } = Route.useRouteContext();

  return (
    <>
      <ProjectHeader user={user} />
      <Outlet></Outlet>
    </>
  );
}
