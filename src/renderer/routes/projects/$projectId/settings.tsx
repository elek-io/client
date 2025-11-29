import {
  Link,
  Outlet,
  type ToPathOption,
  createFileRoute,
} from '@tanstack/react-router';
import { GitBranch, type LucideIcon, Settings } from 'lucide-react';
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

export const Route = createFileRoute('/projects/$projectId/settings')({
  component: ProjectSettingsLayout,
});

function ProjectSettingsLayout(): ReactElement {
  const { projectId } = Route.useParams();
  const settingsNavigation: {
    name: string;
    to: ToPathOption;
    icon: LucideIcon;
  }[] = [
    {
      name: 'General',
      to: '/projects/$projectId/settings/general',
      icon: Settings,
    },
    {
      name: 'Version Control',
      to: '/projects/$projectId/settings/version-control',
      icon: GitBranch,
    },
  ];

  return (
    <div className="flex h-full">
      <Sidebar>
        <ScrollArea>
          <SidebarHeader />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {settingsNavigation.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild>
                        <Link
                          to={item.to}
                          params={{
                            projectId,
                          }}
                          activeProps={{ 'data-active': true }}
                        >
                          <item.icon />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
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
