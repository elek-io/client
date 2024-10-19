import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/projects')({
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw redirect({
        to: '/user/profile',
      });
    }
  },
  component: ProjectsLayout,
});

function ProjectsLayout(): JSX.Element {
  return (
    <>
      <Outlet></Outlet>
    </>
  );
}
