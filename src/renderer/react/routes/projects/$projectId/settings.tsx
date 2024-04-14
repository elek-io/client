import {
  Outlet,
  ToPathOption,
  createFileRoute,
  useRouter,
} from '@tanstack/react-router';
import { LucideIcon, Settings } from 'lucide-react';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Sidebar } from '../../../components/ui/sidebar';
import { SidebarNavigation } from '../../../components/ui/sidebar-navigation';
import { SidebarNavigationItem } from '../../../components/ui/sidebar-navigation-item';

export const Route = createFileRoute('/projects/$projectId/settings')({
  component: ProjectCollectionsLayout,
});

function ProjectCollectionsLayout() {
  const router = useRouter();
  const context = Route.useRouteContext();
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
