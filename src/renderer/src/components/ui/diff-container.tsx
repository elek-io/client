import { type GitCommit, type SupportedLanguage } from '@elek-io/core';
import type { ReactElement } from 'react';
import { CommitAuthor } from './commit-author';

export interface DiffContainerProps {
  type: 'create' | 'before' | 'after' | 'delete';
  commit: GitCommit;
  language: SupportedLanguage;
  children: React.ReactNode;
}

export function DiffContainer({
  type,
  commit,
  language,
  children,
}: DiffContainerProps): ReactElement {
  return (
    <div
      className={`col-span-6 ${type === 'create' || type === 'delete' ? 'col-start-3' : ''}`}
    >
      <div className="text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md">
        <div className="flex items-center justify-between px-6 py-2 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-base font-semibold leading-6">{type}</h2>
          <CommitAuthor commit={commit} language={language} />
        </div>
        <div
          className={
            commit.message.reference.objectType !== 'asset' &&
            commit.message.reference.objectType !== 'collection'
              ? 'flex flex-col gap-6 p-6'
              : ''
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
