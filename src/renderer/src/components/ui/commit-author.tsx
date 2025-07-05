'use client';

import { type GitCommit, type SupportedLanguage } from '@elek-io/core';
import { formatDatetime } from '@renderer/util';
import { Avatar } from './avatar';

export interface CommitAuthorProps {
  language: SupportedLanguage;
  commit: GitCommit;
}

export function CommitAuthor({
  commit,
  language,
}: CommitAuthorProps): JSX.Element {
  return (
    <div
      className={
        'inline-flex items-center justify-center text-zinc-800 dark:text-zinc-200'
      }
    >
      <Avatar name={commit.author.name} className="text-sm mr-2" />
      <div>
        <div className="flex items-center text-sm">
          {commit.message.method} {commit.message.reference.objectType}
        </div>
        <div className="text-xs font-medium text-zinc-400">
          {commit.author.name} -{' '}
          {formatDatetime(commit.datetime, language).relative}
        </div>
      </div>
    </div>
  );
}
