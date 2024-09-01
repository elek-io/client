import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { Sidebar } from '@renderer/components/ui/sidebar';
import { SidebarNavigation } from '@renderer/components/ui/sidebar-navigation';
import { SidebarNavigationItem } from '@renderer/components/ui/sidebar-navigation-item';
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { Layers, Plus } from 'lucide-react';

export const Route = createFileRoute('/projects/$projectId/collections')({
  component: ProjectCollectionsLayout,
});

function ProjectCollectionsLayout(): JSX.Element {
  const context = Route.useRouteContext();

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
            {context.collections.list.map((collection) => (
              <SidebarNavigationItem
                key={collection.id}
                to="/projects/$projectId/collections/$collectionId"
                params={{
                  projectId: context.project.id,
                  collectionId: collection.id,
                }}
              >
                <Layers className="h-6 w-6" aria-hidden="true"></Layers>
                <span className="ml-4">
                  {context.translate(
                    'collection.name.plural',
                    collection.name.plural
                  )}
                </span>
              </SidebarNavigationItem>
            ))}
            {context.collections.total === 0 && (
              <p className="px-3 text-sm">No Collections found</p>
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
