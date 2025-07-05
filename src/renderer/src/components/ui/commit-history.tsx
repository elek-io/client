'use client';

import { type GitCommit, type SupportedLanguage } from '@elek-io/core';
import { cn } from '@renderer/util';
import { type HTMLAttributes } from 'react';
import { Commit } from './commit';

export interface CommitHistoryProps extends HTMLAttributes<HTMLDivElement> {
  commits: GitCommit[];
  language: SupportedLanguage;
  projectId: string;
  disabled?: boolean;
}

export function CommitHistory({
  className,
  commits,
  language,
  projectId,
  disabled,
  ...props
}: CommitHistoryProps): JSX.Element {
  return (
    <div className={cn('relative', className)} {...props}>
      <div className="before:absolute before:h-full before:border-l-2 before:border-brand-600 before:ml-7"></div>
      <div className="grid gap-2 py-2">
        {commits.map((commit) => (
          <Commit
            key={commit.hash}
            language={language}
            commit={commit}
            disabled={disabled || false}
            to="/projects/$projectId/history/$commitHash"
            params={{ projectId, commitHash: commit.hash }}
          />
        ))}
      </div>
    </div>
  );
}
