import { Outlet, createFileRoute, useRouter } from '@tanstack/react-router';
import { Layers, Plus } from 'lucide-react';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Sidebar } from '../../../components/ui/sidebar';
import { SidebarNavigation } from '../../../components/ui/sidebar-navigation';
import { SidebarNavigationItem } from '../../../components/ui/sidebar-navigation-item';

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
      <Sidebar>
        <ScrollArea>
          <SidebarNavigation>
            <SidebarNavigationItem to="/projects/$projectId/collections/create">
              <Plus className="h-6 w-6" aria-hidden="true"></Plus>
              <span className="ml-4">Create Collection</span>
            </SidebarNavigationItem>

            <strong className="mt-2 px-3 text-sm">Collections</strong>
            {context.currentCollections.list.map((collection) => (
              <SidebarNavigationItem
                to="/projects/$projectId/collections/$collectionId"
                params={{
                  projectId: context.currentProject.id,
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
            {context.currentCollections.total === 0 && (
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
