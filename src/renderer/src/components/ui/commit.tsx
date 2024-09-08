'use client';

import {
  GitCommit,
  gitCommitIconSchema,
  SupportedLanguage,
} from '@elek-io/core';
import { cn, formatDatetime, parseGitCommitMessage } from '@renderer/util';
import { Link, LinkProps } from '@tanstack/react-router';
import {
  CircleFadingArrowUp,
  FileQuestion,
  Minus,
  PartyPopper,
  Pencil,
  Plus,
  Tag,
} from 'lucide-react';

export interface CommitProps extends LinkProps {
  language: SupportedLanguage;
  commit: GitCommit;
}

export function Commit({
  commit,
  language,
  activeProps,
  ...props
}: CommitProps): JSX.Element {
  const { icon, method, objectType } = parseGitCommitMessage(commit.message);
  const iconComponent =
    icon === gitCommitIconSchema.enum.INIT ? (
      <PartyPopper className="w-5 h-5" />
    ) : icon === gitCommitIconSchema.enum.CREATE ? (
      <Plus className="w-5 h-5" />
    ) : icon === gitCommitIconSchema.enum.UPDATE ? (
      <Pencil className="w-5 h-5" />
    ) : icon === gitCommitIconSchema.enum.DELETE ? (
      <Minus className="w-5 h-5" />
    ) : icon === ':arrow_up:' ? (
      <CircleFadingArrowUp className="w-5 h-5" />
    ) : (
      <FileQuestion className="w-5 h-5" />
    );

  return (
    <Link
      className={
        'relative flex items-center space-x-4 px-3 py-1 no-underline text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-md'
      }
      activeProps={{
        className: cn(
          'bg-zinc-200 dark:bg-zinc-800 after:absolute after:-right-0.5 after:h-3/6 after:border-l-4 after:rounded after:border-zinc-800 dark:after:border-zinc-300',
          activeProps
        ),
      }}
      {...props}
    >
      <div className="relative bg-white dark:bg-zinc-900 border border-brand-600 rounded-full p-2 z-10">
        {commit.tag && <Tag className="w-4 h-4 absolute -bottom-1 -right-2" />}
        {iconComponent}
      </div>
      <div>
        <div className="flex items-center text-sm">
          {method} {objectType}
        </div>
        <div className="text-xs font-medium text-zinc-400">
          {commit.author.name} -{' '}
          {formatDatetime(commit.datetime, language).relative}
        </div>
      </div>
    </Link>
  );
}
