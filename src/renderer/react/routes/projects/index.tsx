import { formatTimestamp } from '@/util';
import { Link, createFileRoute, useRouter } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { ReactElement } from 'react';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Page } from '../../components/ui/page';

export const Route = createFileRoute('/projects/')({
  component: ListProjectsPage,
});

function ListProjectsPage() {
  const router = useRouter();
  const context = Route.useRouteContext();

  function Description(): ReactElement {
    return (
      <>
        A Project ...
        <br></br>
        Read more about{' '}
        <a href="#" className="text-brand-600 hover:underline">
          Projects in the documentation
        </a>
        .
      </>
    );
  }

  function Actions(): ReactElement {
    return (
      <>
        <Button onClick={() => router.navigate({ to: '/projects/create' })}>
          <Plus className="w-4 h-4 mr-2"></Plus>
          Create Project
        </Button>
      </>
    );
  }

  return (
    <Page
      title="Projects"
      description={<Description></Description>}
      actions={<Actions></Actions>}
      layout="bare"
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {context.projects.list.map((project) => {
          const created = formatTimestamp(
            project.created,
            context.currentUser.language
          );
          const updated = formatTimestamp(
            project.updated,
            context.currentUser.language
          );

          return (
            <Link
              key={project.id}
              to="/projects/$projectId/dashboard"
              params={{ projectId: project.id }}
              className="no-underline"
            >
              <Card className="transition hover:shadow-lg hover:dark:border-zinc-200">
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                {/* <CardContent>
                  <Badge>{project.version}</Badge>
                  {JSON.stringify(project, undefined, 2)}
                </CardContent> */}
              </Card>
            </Link>
          );
        })}
      </div>
    </Page>
  );
}
