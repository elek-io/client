'use client';

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
import type { ReactElement } from 'react';

import { cn, formatDatetime } from '@renderer/lib/utils';

import { type GitCommit, type SupportedLanguage } from '@elek-io/core';

export interface CommitProps extends LinkProps {
  language: SupportedLanguage;
  commit: GitCommit;
}

export function Commit({
  commit,
  language,
  activeProps,
  ...props
}: CommitProps): ReactElement {
  let iconComponent: ReactElement;

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
      className={
        'relative flex items-center space-x-4 rounded-md px-3 py-1 text-zinc-800 no-underline transition-colors hover:bg-zinc-300 dark:text-zinc-200 dark:hover:bg-zinc-700'
      }
      activeProps={{
        className: cn(
          'bg-zinc-200 dark:bg-zinc-800 after:absolute after:-right-0.5 after:h-3/6 after:border-l-4 after:rounded-sm after:border-zinc-800 dark:after:border-zinc-300',
          activeProps
        ),
      }}
      {...props}
    >
      <div className="border-brand-600 relative z-10 rounded-full border bg-white p-2 dark:bg-zinc-900">
        {commit.tag && <Tag className="absolute -right-2 -bottom-1 h-4 w-4" />}
        {iconComponent}
      </div>
      <div>
        <div className="flex items-center text-sm">
          {commit.message.method} {commit.message.reference.objectType}
        </div>
        <div className="text-xs font-medium text-zinc-400">
          {commit.author.name} -{' '}
          {formatDatetime(commit.datetime, language).relative}
        </div>
      </div>
    </Link>
  );
}
