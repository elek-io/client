import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { Sidebar } from '@renderer/components/ui/sidebar';
import { SidebarNavigation } from '@renderer/components/ui/sidebar-navigation';
import { SidebarNavigationItem } from '@renderer/components/ui/sidebar-navigation-item';
import { collectionsQueryOptions } from '@renderer/queries';
import { useQuery } from '@tanstack/react-query';
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { Layers, Plus } from 'lucide-react';

export const Route = createFileRoute('/projects/$projectId/collections')({
  component: ProjectCollectionsLayout,
});

function ProjectCollectionsLayout(): JSX.Element {
  const context = Route.useRouteContext();
  const { projectId } = Route.useParams();
  const collectionsQuery = useQuery(collectionsQueryOptions({ projectId }));

  return (
    <div className="flex h-full">
      <Sidebar>
        <ScrollArea>
          <SidebarNavigation>
            <SidebarNavigationItem to="/projects/$projectId/collections/create">
              <Plus className="h-6 w-6" aria-hidden="true"></Plus>
              <span className="ml-4">Create Collection</span>
            </SidebarNavigationItem>

            <strong className="mt-2 px-3 text-sm">Collections</strong>
            {collectionsQuery.data ? (
              collectionsQuery.data.list.map((collection) => (
                <>
                  {collectionsQuery.data.total === 0 && (
                    <p className="px-3 text-sm">No Collections found</p>
                  )}

                  <SidebarNavigationItem
                    key={collection.id}
                    to="/projects/$projectId/collections/$collectionId"
                    params={{
                      projectId,
                      collectionId: collection.id,
                    }}
                  >
                    <Layers className="h-6 w-6" aria-hidden="true"></Layers>
                    <span className="ml-4">
                      {context.translateContent(
                        'collection.name.plural',
                        collection.name.plural
                      )}
                    </span>
                  </SidebarNavigationItem>
                </>
              ))
            ) : (
              <p>Loading...</p>
            )}
          </SidebarNavigation>
        </ScrollArea>
      </Sidebar>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Outlet></Outlet>
      </div>
    </div>
  );
}
