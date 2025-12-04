import { Slot } from '@radix-ui/react-slot';
import { type VariantProps } from 'class-variance-authority';
import {
  CloudOffIcon,
  FolderGit2Icon,
  GithubIcon,
  GitlabIcon,
} from 'lucide-react';
import * as React from 'react';

import { cn } from '@renderer/lib/utils';
import { badgeVariants } from '@renderer/lib/variants';

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
  }): React.JSX.Element {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

function RemoteOriginBadge({
  remoteOriginUrl,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
    remoteOriginUrl: string | null;
  }): React.JSX.Element {
  if (remoteOriginUrl !== null) {
    let hostname: string;
    let path: string;

    // Parse SSH URLs (git@host:path) vs HTTPS URLs (https://host/path)
    if (remoteOriginUrl.startsWith('git@')) {
      // SSH format: git@github.com:user/repo.git
      const match = remoteOriginUrl.match(/^git@([^:]+):(.+)$/);
      if (match !== null && match[1] !== undefined && match[2] !== undefined) {
        hostname = match[1];
        path = match[2];
      } else {
        // Fallback for malformed SSH URLs
        hostname = 'unknown';
        path = remoteOriginUrl;
      }
    } else {
      // HTTPS/HTTP format
      const url = new URL(remoteOriginUrl);
      hostname = url.hostname;
      path = url.pathname.startsWith('/')
        ? url.pathname.slice(1)
        : url.pathname;
    }

    const HostIcon = hostname.includes('github.com')
      ? GithubIcon
      : hostname.includes('gitlab.com')
        ? GitlabIcon
        : FolderGit2Icon;

    // Remove .git extension if present
    path = path.endsWith('.git') ? path.slice(0, -4) : path;

    return (
      <Badge {...props}>
        <HostIcon />
        {path}
      </Badge>
    );
  }

  return (
    <Badge {...props}>
      <CloudOffIcon />
      Local
    </Badge>
  );
}

export { Badge, RemoteOriginBadge };
