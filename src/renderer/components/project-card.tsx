import { Link } from '@tanstack/react-router';
import { EllipsisIcon } from 'lucide-react';

import { Badge, RemoteOriginBadge } from '@renderer/components/ui/badge';
import { Button } from '@renderer/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@renderer/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';

import type { Project } from '@elek-io/core';

import { Skeleton } from './ui/skeleton';

function ProjectCard({ project }: { project: Project }): React.JSX.Element {
  return (
    <Card className="hover:border-accent-foreground">
      <CardHeader>
        <Link
          to="/projects/$projectId/dashboard"
          params={{ projectId: project.id }}
          className="no-underline"
        >
          <CardTitle>{project.name}</CardTitle>
          <CardDescription>{project.description}</CardDescription>
        </Link>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <EllipsisIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Team</DropdownMenuItem>
              <DropdownMenuItem>Subscription</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent>
        <RemoteOriginBadge
          variant="outline"
          remoteOriginUrl={project.remoteOriginUrl}
        />
        <Badge variant="outline">Core version: {project.coreVersion}</Badge>
      </CardContent>
    </Card>
  );
}

function ProjectCardSkeleton(): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-3/4 rounded" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-full rounded" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-1/2 rounded" />
      </CardContent>
    </Card>
  );
}

export { ProjectCard, ProjectCardSkeleton };
