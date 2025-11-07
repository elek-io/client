import { createFileRoute, useRouter } from '@tanstack/react-router';
import { type ReactElement } from 'react';

import { Button } from '@renderer/components/ui/button';
import { CommitHistory } from '@renderer/components/ui/commit-history';
import { Page } from '@renderer/components/ui/page';
import { PageSection } from '@renderer/components/ui/page-section';

export const Route = createFileRoute('/projects/$projectId/dashboard')({
  component: ProjectDashboardPage,
});

function ProjectDashboardPage(): ReactElement {
  const router = useRouter();
  const context = Route.useRouteContext();

  function Description(): ReactElement {
    return <>The Dashboard gives you an overview of your project.</>;
  }

  function LatestChangesActions(): ReactElement {
    return (
      <>
        <Button
          onClick={async () =>
            router.navigate({
              to: '/projects/$projectId/history',
              params: { projectId: context.project.id },
            })
          }
        >
          Full History
        </Button>
      </>
    );
  }

  return (
    <Page title="Dashboard" layout="bare" description={<Description />}>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-8">
        <PageSection
          title="Current Project"
          description="Some debug Project output"
          className="lg:col-span-2"
          standalone
        >
          <pre>
            <code>{JSON.stringify(context.project, null, 2)}</code>
          </pre>
        </PageSection>
        <PageSection
          title="Latest changes"
          description="View the latest changes made to the project."
          actions={<LatestChangesActions />}
          className="lg:col-span-1"
          standalone
        >
          <CommitHistory
            projectId={context.project.id}
            commits={context.project.fullHistory.slice(0, 5)}
            language={context.user.language}
          />
        </PageSection>
      </div>
    </Page>
  );
}
