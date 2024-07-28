import { Page } from '@renderer/components/ui/page';
import { createFileRoute } from '@tanstack/react-router';
import { ReactElement } from 'react';

export const Route = createFileRoute('/projects/$projectId/dashboard')({
  component: ProjectDashboardPage,
});

function ProjectDashboardPage(): JSX.Element {
  const context = Route.useRouteContext();

  function Description(): ReactElement {
    return <>The Dashboard gives you an overview of your project.</>;
  }

  function Actions(): ReactElement {
    return (
      <>
        {/* <Button
          intent="primary"
          prependIcon={CogIcon}
          onClick={() => router.push(router.asPath + '/update')}
        >
          Configure
        </Button> */}
      </>
    );
  }

  return (
    <Page
      title="Dashboard"
      layout="bare"
      description={<Description></Description>}
      actions={<Actions></Actions>}
    >
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-8">
        <div className="grid grid-cols-1 gap-4 lg:col-span-2">
          <div className="rounded-lg bg-white dark:bg-zinc-900 shadow p-4">
            Current Project: {JSON.stringify(context.currentProject)}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-lg bg-white dark:bg-zinc-900 shadow p-4">
            Test
          </div>
        </div>
      </div>
    </Page>
  );
}
