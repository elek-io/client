import type { ReactElement } from 'react';

import { CommitAuthor } from '@renderer/components/commit-author';
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@renderer/components/ui/card';

import { type GitCommit, type SupportedLanguage } from '@elek-io/core';

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
    <Card
      className={`col-span-6 ${type === 'create' || type === 'delete' ? 'col-start-3' : ''}`}
    >
      <CardHeader>
        <CardTitle>
          {commit.message.method} {commit.message.reference.objectType}
        </CardTitle>
        <CardDescription>{commit.hash}</CardDescription>
        <CardAction>
          <CommitAuthor commit={commit} language={language} />
        </CardAction>
      </CardHeader>

      {children}
    </Card>
  );
}
