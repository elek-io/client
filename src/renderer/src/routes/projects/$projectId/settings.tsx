import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { Sidebar } from '@renderer/components/ui/sidebar';
import { SidebarNavigation } from '@renderer/components/ui/sidebar-navigation';
import { SidebarNavigationItem } from '@renderer/components/ui/sidebar-navigation-item';
import {
  Outlet,
  type ToPathOption,
  createFileRoute,
} from '@tanstack/react-router';
import { GitBranch, type LucideIcon, Settings } from 'lucide-react';
import type { ReactElement } from 'react';

export const Route = createFileRoute('/projects/$projectId/settings')({
  component: ProjectCollectionsLayout,
});

function ProjectCollectionsLayout(): ReactElement {
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
          <SidebarNavigation>
            {settingsNavigation.map((navigation) => (
              <SidebarNavigationItem key={navigation.to} to={navigation.to}>
                <navigation.icon
                  className="h-6 w-6"
                  aria-hidden="true"
                ></navigation.icon>
                <span className="ml-4">{navigation.name}</span>
              </SidebarNavigationItem>
            ))}
          </SidebarNavigation>
        </ScrollArea>
      </Sidebar>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Outlet></Outlet>
      </div>
    </div>
  );
}
