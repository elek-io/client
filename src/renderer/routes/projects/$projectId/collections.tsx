import { Link, Outlet, createFileRoute } from '@tanstack/react-router';
import { Layers, Plus } from 'lucide-react';
import type { ReactElement } from 'react';

import { ScrollArea } from '@renderer/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@renderer/components/ui/sidebar';

export const Route = createFileRoute('/projects/$projectId/collections')({
  component: ProjectCollectionsLayout,
});

function ProjectCollectionsLayout(): ReactElement {
  const context = Route.useRouteContext();

  return (
    <div className="flex h-full">
      <Sidebar>
        <ScrollArea>
          <SidebarHeader>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      to="/projects/$projectId/collections/create"
                      params={{ projectId: context.project.id }}
                      activeProps={{ 'data-active': true }}
                    >
                      <Plus />
                      <span>Create Collection</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Collections</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {context.collections.list.map((collection) => (
                    <SidebarMenuItem key={collection.id}>
                      <SidebarMenuButton asChild>
                        <Link
                          to="/projects/$projectId/collections/$collectionId"
                          params={{
                            projectId: context.project.id,
                            collectionId: collection.id,
                          }}
                          activeProps={{ 'data-active': true }}
                        >
                          <Layers />
                          <span>
                            {context.translateContent(
                              'collection.name.plural',
                              collection.name.plural
                            )}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  {context.collections.total === 0 && (
                    <p className="px-3 text-sm">No Collections found</p>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </ScrollArea>
      </Sidebar>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
