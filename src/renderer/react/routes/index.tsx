import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    throw redirect({
      to: '/projects',
    });
  },
  component: Index,
});

function Index() {
  return <></>;
}
