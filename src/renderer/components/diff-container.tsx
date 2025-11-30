import type { ReactElement } from 'react';

import { CommitAuthor } from '@renderer/components/commit-author';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@renderer/components/ui/card';
import { Skeleton } from '@renderer/components/ui/skeleton';

import { type GitCommit } from '@elek-io/core';

export interface DiffContainerProps {
  type: 'create' | 'before' | 'after' | 'delete';
  commit: GitCommit;
  children: React.ReactNode;
}

export function DiffContainer({
  type,
  commit,
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
        <CardAction>
          <CommitAuthor commit={commit} />
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-6">{children}</CardContent>
    </Card>
  );
}

export function DiffContainerSkeleton(): React.JSX.Element {
  return (
    <Card className="col-span-6">
      <CardHeader>
        <CardTitle>Loading...</CardTitle>
        <CardDescription />
        <CardAction />
      </CardHeader>

      <CardContent className="grid gap-6">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-8 w-1/2" />
      </CardContent>
    </Card>
  );
}
