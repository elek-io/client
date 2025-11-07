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
  if (remoteOriginUrl) {
    const url = new URL(remoteOriginUrl);

    const HostIcon = url.hostname.includes('github.com')
      ? GithubIcon
      : url.hostname.includes('gitlab.com')
        ? GitlabIcon
        : FolderGit2Icon;

    let path = url.pathname.startsWith('/')
      ? url.pathname.slice(1)
      : url.pathname;
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
