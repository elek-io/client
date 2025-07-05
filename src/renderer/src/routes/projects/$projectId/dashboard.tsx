import { Button } from '@renderer/components/ui/button';
import { Card } from '@renderer/components/ui/card';
import { CommitHistory } from '@renderer/components/ui/commit-history';
import { Page } from '@renderer/components/ui/page';
import { PageSection } from '@renderer/components/ui/page-section';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { ReactElement } from 'react';

export const Route = createFileRoute('/projects/$projectId/dashboard')({
  component: ProjectDashboardPage,
});

function ProjectDashboardPage(): JSX.Element {
  const router = useRouter();
  const context = Route.useRouteContext();

  function Description(): ReactElement {
    return <>The Dashboard gives you an overview of your project.</>;
  }

  function LatestChangesActions(): ReactElement {
    return (
      <>
        <Button
          onClick={() =>
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
    <Page
      title="Dashboard"
      layout="bare"
      description={<Description />}
      // actions={<Actions />}
    >
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-8">
        <div className="grid grid-cols-1 gap-4 lg:col-span-2">
          <Card>
            <PageSection
              title="Current Project debug JSON"
              className="border-none"
            >
              <pre>{JSON.stringify(context.project, null, 2)}</pre>
            </PageSection>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <PageSection
              title="Latest changes"
              actions={<LatestChangesActions />}
              className="border-none pb-0"
            >
              <CommitHistory
                projectId={context.project.id}
                commits={context.project.fullHistory.slice(0, 5)}
                language={context.user.language}
              />
            </PageSection>
          </Card>
        </div>
      </div>
    </Page>
  );
}
