'use client';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@renderer/components/ui/sidebar';
import { Link, useRouter } from '@tanstack/react-router';
import { ChevronsUpDown, FolderGit2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function ProjectDropdown(): JSX.Element {
  const router = useRouter();
  const { isMobile } = useSidebar();
  // const projectsQuery = useQuery(projectsQueryOptions); @todo after switch to tanstack query

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              tooltip={`Project ${'Project name'}`}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-brand-600 text-zinc-200">
                <FolderGit2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Project name</span>
                <span className="truncate text-xs">Local</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            {/* <DropdownMenuLabel className="text-xs text-muted-foreground">
              Teams
            </DropdownMenuLabel> */}
            {/* {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => setActiveTeam(team)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <team.logo className="size-4 shrink-0" />
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))} */}
            {/* <DropdownMenuSeparator /> */}
            <DropdownMenuItem asChild>
              <Link to="/projects">
                Change
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
