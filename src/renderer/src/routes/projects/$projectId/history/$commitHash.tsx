import { Badge } from '@renderer/components/ui/badge';
import { Page } from '@renderer/components/ui/page';
import { formatDatetime, parseGitCommitMessage } from '@renderer/util';
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

    // const resolvedAsset = await context.core.assets.read({
    //   projectId: context.project.id,
    //   assetId: commit.assetId,
    //   commitHash: commit.hash,
    // });
    const { method, objectType } = parseGitCommitMessage(commit.message);

    return {
      commit,
      method,
      objectType,
    };
  },
  component: ProjectHistoryCommitPage,
});

function ProjectHistoryCommitPage(): JSX.Element {
  const context = Route.useRouteContext();

  function DisplayChanges(): ReactElement {
    switch (context.objectType) {
      case 'Asset': {
        return <>Asset changes</>;
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
              {context.commit.tag}
            </Badge>
          </>
        )}
      </>
    );
  }

  return (
    <Page
      title={`${context.method} ${context.objectType}`}
      description={<Description />}
      layout="bare"
    >
      <DisplayChanges />
    </Page>
  );
}
