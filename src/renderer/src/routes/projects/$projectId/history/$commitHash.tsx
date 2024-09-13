import { Asset } from '@elek-io/core';
import { Badge } from '@renderer/components/ui/badge';
import { Page } from '@renderer/components/ui/page';
import { formatDatetime } from '@renderer/util';
import { createFileRoute } from '@tanstack/react-router';
import { Tag } from 'lucide-react';
import { ReactElement } from 'react';

export const Route = createFileRoute(
  '/projects/$projectId/history/$commitHash'
)({
  beforeLoad: async ({ context, params }) => {
    const commit = context.project.fullHistory.find(
      (commit) => commit.hash === params.commitHash
    );
    if (!commit) {
      throw new Error('Commit not found in Project history');
    }

    const resolvedObject: { asset: Asset | undefined } = {
      asset: undefined,
    };

    switch (commit.message.reference.objectType) {
      case 'asset':
        resolvedObject.asset = await context.core.assets.read({
          projectId: context.project.id,
          id: commit.message.reference.id,
          commitHash: commit.hash,
        });
        break;

      default:
        break;
    }

    return { commit, ...resolvedObject };
  },
  component: ProjectHistoryCommitPage,
});

function ProjectHistoryCommitPage(): JSX.Element {
  const context = Route.useRouteContext();

  function DisplayChanges(): ReactElement {
    switch (context.commit.message.reference.objectType) {
      case 'asset': {
        return <>Asset: {JSON.stringify(context.asset)}</>;
      }
      default:
        return <>Object changes</>;
    }
  }

  function Description(): ReactElement {
    return (
      <>
        {context.commit.author.name} -{' '}
        {
          formatDatetime(context.commit.datetime, context.user.language)
            .relative
        }
        {context.commit.tag && (
          <>
            <br />
            <Badge className="relative mt-2" variant="secondary">
              <Tag className="w-4 h-4 absolute -bottom-2 -right-3" />
              {context.commit.tag.message}
            </Badge>
          </>
        )}
      </>
    );
  }

  return (
    <Page
      title={`${context.commit.message.method} ${context.commit.message.reference.objectType}`}
      description={<Description />}
      layout="bare"
    >
      {JSON.stringify(context.commit)}
      <DisplayChanges />
    </Page>
  );
}
