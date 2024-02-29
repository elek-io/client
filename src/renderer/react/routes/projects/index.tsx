import { Button, Page } from '@elek-io/ui';
import { PlusIcon } from '@heroicons/react/20/solid';
import { Link, createFileRoute, useRouter } from '@tanstack/react-router';
import { ReactElement } from 'react';

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
        <Button
          intent="primary"
          prependIcon={PlusIcon}
          onClick={() => router.navigate({ to: '/projects/create' })}
        >
          Create Project
        </Button>
      </>
    );
  }

  return (
    <Page
      breadcrumbs={[]}
      title="Projects"
      description={<Description></Description>}
      actions={<Actions></Actions>}
      layout="overlap"
    >
      <ul
        role="list"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
      >
        {context.projects.list.map((project) => (
          <Link
            key={project.id}
            to="/projects/$projectId/dashboard"
            params={{ projectId: project.id }}
          >
            <li className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white shadow">
              <div className="flex flex-1 flex-col p-4">
                <h2 className="text-lg font-medium leading-6 text-gray-900">
                  {project.name} ({project.status})
                </h2>
                <p className="text-sm text-gray-500">{project.description}</p>
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                  {project.version}
                </span>
                <p className="mt-2 text-sm text-gray-500">
                  Created: {project.created}
                  <br></br>Updated: {project.updated}
                </p>
              </div>
              {/* <div>
                <div className="-mt-px flex divide-x divide-gray-200">
                  <div className="flex w-0 flex-1">
                    {JSON.stringify(project, undefined, 2)}
                  </div>
                </div>
              </div> */}
            </li>
          </Link>
        ))}
      </ul>
    </Page>
  );
}
