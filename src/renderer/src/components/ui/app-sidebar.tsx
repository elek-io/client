import { RouterContext } from '@renderer/routes/__root';
import { cn } from '@renderer/util';
import { Link, useMatch, useRouter } from '@tanstack/react-router';
import { ChevronRight, ExternalLink, Info, LucideIcon } from 'lucide-react';
import {
  version as clientVersion,
  dependencies,
} from '../../../../../package.json';
import { ProjectDropdown } from '../project-dropdown';
import { UserDropdown } from '../user-dropdown';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Separator } from './separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from './sidebar';

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  electron: RouterContext['electron'];
  groups: {
    title: string;
    items: {
      title: string;
      url: string;
      icon?: LucideIcon;
      isActive?: boolean;
      items?: {
        title: string;
        url: string;
      }[];
    }[];
  }[];
}

export function AppSidebar({
  electron,
  groups,
  ...props
}: AppSidebarProps): JSX.Element {
  const router = useRouter();
  const { isMobile, open } = useSidebar();

  return (
    <Sidebar collapsible="icon" variant="sidebar" {...props}>
      <SidebarHeader className={cn(open ? 'pt-16' : 'pt-12', '')}>
        <ProjectDropdown />
        <Separator />
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) =>
                item.items ? (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={item.isActive || false}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <Link to={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      asChild
                      isActive={
                        useMatch({
                          from: item.url,
                          shouldThrow: false,
                        }) !== undefined
                          ? true
                          : false
                      }
                    >
                      <Link to={item.url}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroup>
        ))}
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter>
        <Separator />
        <UserDropdown />
        <Separator />
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="sm"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground text-center"
                  tooltip={'About'}
                >
                  <Info />
                  <span className="truncate">
                    elek.<span className="text-brand-600">io</span> Client v
                    {clientVersion}
                  </span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? 'bottom' : 'right'}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() =>
                      window.open(
                        'https://github.com/elek-io/client/issues',
                        '_blank'
                      )
                    }
                  >
                    Report an issue
                    <DropdownMenuShortcut>
                      <ExternalLink className="w-4 h-4"></ExternalLink>
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    elek.io Client
                    <DropdownMenuShortcut>
                      v{clientVersion}
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    elek.io Core
                    <DropdownMenuShortcut>
                      v{dependencies['@elek-io/core']}
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    Electron
                    <DropdownMenuShortcut>
                      v{electron.process.versions['electron']}
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Chromium
                    <DropdownMenuShortcut>
                      v{electron.process.versions['chrome']}
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Node
                    <DropdownMenuShortcut>
                      v{electron.process.versions['node']}
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
