'use client';

import { useProject } from '@root/src/renderer/hooks/useProject';
import type { ReactElement } from 'react';

import { Avatar } from '@renderer/components/ui/avatar';

import { type GitCommit } from '@elek-io/core';

export interface CommitAuthorProps {
  commit: GitCommit;
}

export function CommitAuthor({ commit }: CommitAuthorProps): ReactElement {
  const { formatDatetime } = useProject();
  return (
    <div className="inline-flex items-center justify-center text-zinc-800 dark:text-zinc-200">
      <Avatar name={commit.author.name} className="mr-2 text-sm" />
      <div>
        <div className="flex items-center text-sm">
          {commit.message.method} {commit.message.reference.objectType}
        </div>
        <div className="text-xs font-medium text-zinc-400">
          {commit.author.name} -{' '}
          {formatDatetime({ datetime: commit.datetime }).relative}
        </div>
      </div>
    </div>
  );
}
