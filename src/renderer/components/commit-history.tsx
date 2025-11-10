'use client';

import { type HTMLAttributes, type ReactElement } from 'react';

import { Commit } from '@renderer/components/commit';
import { cn } from '@renderer/lib/utils';

import { type GitCommit, type SupportedLanguage } from '@elek-io/core';

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
}: CommitHistoryProps): ReactElement {
  return (
    <div className={cn('relative', className)} {...props}>
      <div className="before:absolute before:ml-7 before:h-full before:border-l-2 before:border-primary"></div>
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
