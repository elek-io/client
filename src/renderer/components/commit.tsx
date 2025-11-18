'use client';

import { QuestionMarkIcon } from '@radix-ui/react-icons';
import { Link, type LinkProps } from '@tanstack/react-router';
import {
  CircleFadingArrowUp,
  FileQuestion,
  PartyPopper,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from 'lucide-react';

import { cn, formatDatetime } from '@renderer/lib/utils';
import { sidebarMenuButtonVariants } from '@renderer/lib/variants';

import { type GitCommit, type SupportedLanguage } from '@elek-io/core';

import { Skeleton } from './ui/skeleton';

export interface CommitProps extends LinkProps {
  language: SupportedLanguage;
  commit: GitCommit;
}

export function Commit({
  commit,
  language,
  ...props
}: CommitProps): React.JSX.Element {
  let iconComponent: React.JSX.Element;

  switch (commit.message.method) {
    case 'create':
      iconComponent =
        commit.message.reference.objectType === 'project' ? (
          <PartyPopper className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        );
      break;
    case 'update':
      iconComponent = <Pencil className="h-4 w-4" />;
      break;
    case 'delete':
      iconComponent = <Trash2 className="h-4 w-4" />;
      break;
    case 'upgrade':
      iconComponent = <CircleFadingArrowUp className="h-4 w-4" />;
      break;
    default:
      iconComponent = <FileQuestion className="h-4 w-4" />;
      break;
  }

  return (
    <Link
      // className="relative flex items-center space-x-4 rounded-md px-3 py-1 text-zinc-800 no-underline transition-colors hover:bg-zinc-300 dark:text-zinc-200 dark:hover:bg-zinc-700"
      className={cn(sidebarMenuButtonVariants({ size: 'lg' }), 'no-underline')}
      activeProps={{ 'data-active': true }}
      {...props}
    >
      <div className="relative z-10 rounded-full border border-primary bg-sidebar p-2 text-sidebar-foreground">
        {commit.tag ? (
          <Tag className="absolute -right-2 -bottom-1 h-4 w-4" />
        ) : null}
        {iconComponent}
      </div>
      <div>
        <div className="flex items-center text-sm text-sidebar-foreground">
          {commit.message.method} {commit.message.reference.objectType}
        </div>
        <div className="text-xs font-medium text-sidebar-foreground/70">
          {commit.author.name} -{' '}
          {formatDatetime(commit.datetime, language).relative}
        </div>
      </div>
    </Link>
  );
}

export function CommitSkeleton(): React.JSX.Element {
  return (
    <div className="relative flex items-center space-x-4 rounded-md px-3 py-1">
      <div className="relative z-10 rounded-full border border-primary bg-white p-2 dark:bg-zinc-900">
        <QuestionMarkIcon className="h-4 w-4" />
      </div>
      <div>
        <Skeleton className="mb-2 h-4 w-32 rounded" />
        <Skeleton className="h-3 w-48 rounded" />
      </div>
    </div>
  );
}
