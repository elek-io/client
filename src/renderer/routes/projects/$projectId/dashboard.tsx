import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';

import {
  CommitHistory,
  CommitHistorySkeleton,
} from '@renderer/components/commit-history';
import { Page } from '@renderer/components/page';
import { PageSection } from '@renderer/components/page-section';
import { Button } from '@renderer/components/ui/button';
import { queryOptions } from '@renderer/queries';

export const Route = createFileRoute('/projects/$projectId/dashboard')({
  component: ProjectDashboardPage,
});

function ProjectDashboardPage(): React.JSX.Element {
  const { projectId } = Route.useParams();
  const router = useRouter();
  const {
    data: project,
    isPending: isProjectPending,
    isError: isProjectError,
    error: projectError,
  } = useQuery(queryOptions.projects.read({ id: projectId }));

  if (isProjectError) {
    throw projectError;
  }

  function Description(): React.JSX.Element {
    return <>The Dashboard gives you an overview of your project.</>;
  }

  function LatestChangesActions(): React.JSX.Element {
    if (isProjectError) {
      throw projectError;
    }

    return (
      <>
        {isProjectPending ? null : (
          <Button
            onClick={async () =>
              router.navigate({
                to: '/projects/$projectId/history',
                params: { projectId: project.id },
              })
            }
          >
            Full History
          </Button>
        )}
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
            <code>{JSON.stringify(project, null, 2)}</code>
          </pre>
        </PageSection>
        <PageSection
          title="Latest changes"
          description="View the latest changes made to the project."
          actions={<LatestChangesActions />}
          className="lg:col-span-1"
          standalone
        >
          {isProjectPending ? (
            <CommitHistorySkeleton />
          ) : (
            <CommitHistory
              projectId={project.id}
              commits={project.fullHistory.slice(0, 5)}
              language="en"
            />
          )}
        </PageSection>
      </div>
    </Page>
  );
}
