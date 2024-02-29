import { CubeTransparentIcon, PlusIcon } from '@heroicons/react/20/solid';
import {
  Link,
  Outlet,
  createFileRoute,
  useRouter,
} from '@tanstack/react-router';

export const Route = createFileRoute('/projects/$projectId/collections')({
  beforeLoad: async ({ context, params }) => {
    const currentCollections = await context.core.collections.list({
      projectId: params.projectId,
    });

    return { currentCollections };
  },
  component: ProjectCollectionsLayout,
});

function ProjectCollectionsLayout() {
  const router = useRouter();
  const context = Route.useRouteContext();

  return (
    <div className="flex h-full">
      <aside className="w-60 flex flex-col flex-shrink-0 bg-zinc-900 border-r border-zinc-800">
        <nav className="flex-1" aria-label="Sidebar">
          <div className="p-2">
            <strong className="px-3 text-sm">Collections</strong>
            <Link
              to={'/projects/$projectId/collections/create'}
              className="group flex items-center px-2 py-2 text-sm no-underline border border-transparent rounded-md hover:bg-zinc-800 hover:text-zinc-200"
              activeProps={{
                className: 'bg-zinc-800 text-zinc-200 border-zinc-700',
              }}
              inactiveProps={{ className: 'text-zinc-400' }}
            >
              <PlusIcon className="mr-4 h-4 w-4" aria-hidden="true"></PlusIcon>
              Create Collection
            </Link>
            {context.currentCollections.list.map((collection) => (
              <Link
                to={'/projects/$projectId/collections/$collectionId'}
                params={{
                  projectId: context.currentProject.id,
                  collectionId: collection.id,
                }}
                className="group flex items-center px-2 py-2 text-sm no-underline border border-transparent rounded-md hover:bg-zinc-800 hover:text-zinc-200"
                activeProps={{
                  className: 'bg-zinc-800 text-zinc-200 border-zinc-700',
                }}
                inactiveProps={{ className: 'text-zinc-400' }}
              >
                <CubeTransparentIcon
                  className="mr-4 h-4 w-4"
                  aria-hidden="true"
                ></CubeTransparentIcon>
                {context.translate(
                  'collection.name.singular',
                  collection.name.singular
                )}
              </Link>
            ))}
          </div>
        </nav>
        {JSON.stringify(context.currentCollections)}
      </aside>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Outlet></Outlet>
      </div>
    </div>
  );
}
