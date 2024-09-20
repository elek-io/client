import { Asset, Project } from '@elek-io/core';
import { AssetInfo } from '@renderer/components/ui/asset-info';
import { Avatar } from '@renderer/components/ui/avatar';
import { Badge } from '@renderer/components/ui/badge';
import { Page } from '@renderer/components/ui/page';
import { ProjectDiff } from '@renderer/components/ui/project-diff';
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

    const resolvedObject: {
      project: { before: Project | undefined; after: Project | undefined };
      asset: { before: Asset | undefined; after: Asset | undefined };
    } = {
      project: {
        before: undefined,
        after: undefined,
      },
      asset: {
        before: undefined,
        after: undefined,
      },
    };

    switch (commit.message.reference.objectType) {
      case 'project': {
        if (
          commit.message.method === 'update' ||
          commit.message.method === 'delete'
        ) {
          const projectCommitHistory = context.project.fullHistory.filter(
            (commit) =>
              commit.message.reference.objectType === 'asset' &&
              commit.message.reference.id === commit.message.reference.id
          );
          const currentCommitIndex = projectCommitHistory.findIndex(
            (commit) => commit.hash === params.commitHash
          );
          resolvedObject.project.before = await context.core.projects.read({
            id: context.project.id,
            commitHash: projectCommitHistory.at(currentCommitIndex + 1)?.hash,
          });
        }

        if (commit.message.method !== 'delete') {
          resolvedObject.project.after = await context.core.projects.read({
            id: context.project.id,
            commitHash: commit.hash,
          });
        }
        break;
      }
      case 'asset': {
        // When updating or deleting an Asset, we need to find the previous commit to show the before state
        if (
          commit.message.method === 'update' ||
          commit.message.method === 'delete'
        ) {
          const assetCommitHistory = context.project.fullHistory.filter(
            (commit) =>
              commit.message.reference.objectType === 'asset' &&
              commit.message.reference.id === commit.message.reference.id
          );
          const currentCommitIndex = assetCommitHistory.findIndex(
            (commit) => commit.hash === params.commitHash
          );
          resolvedObject.asset.before = await context.core.assets.read({
            projectId: context.project.id,
            id: commit.message.reference.id,
            commitHash: assetCommitHistory.at(currentCommitIndex + 1)?.hash,
          });
        }

        // Delete commits don't have an after state
        if (commit.message.method !== 'delete') {
          resolvedObject.asset.after = await context.core.assets.read({
            projectId: context.project.id,
            id: commit.message.reference.id,
            commitHash: commit.hash,
          });
        }
        break;
      }

      default:
        break;
    }

    return { commit, resolvedObject };
  },
  component: ProjectHistoryCommitPage,
});

function ProjectHistoryCommitPage(): JSX.Element {
  const context = Route.useRouteContext();

  function DisplayChanges(): ReactElement {
    switch (context.commit.message.reference.objectType) {
      case 'project': {
        return (
          <>
            {!context.resolvedObject.project.before && (
              <div className="col-span-6 col-start-3">
                {context.resolvedObject.project.after && (
                  <ProjectDiff project={context.resolvedObject.project.after} />
                )}
              </div>
            )}

            {!context.resolvedObject.project.after && (
              <div className="col-span-6 col-start-3">
                {context.resolvedObject.project.before && (
                  <ProjectDiff
                    project={context.resolvedObject.project.before}
                  />
                )}
              </div>
            )}

            {context.resolvedObject.project.before &&
              context.resolvedObject.project.after && (
                <>
                  <div className="col-span-6">
                    <h3 className="text-center text-white mb-4">Before</h3>
                    {context.resolvedObject.project.before && (
                      <ProjectDiff
                        project={context.resolvedObject.project.before}
                      />
                    )}
                  </div>

                  <div className="col-span-6">
                    <h3 className="text-center text-white mb-4">After</h3>
                    {context.resolvedObject.project.after && (
                      <ProjectDiff
                        project={context.resolvedObject.project.after}
                      />
                    )}
                  </div>
                </>
              )}
          </>
        );
      }
      case 'asset': {
        return (
          <>
            {!context.resolvedObject.asset.before && (
              <div className="col-span-6 col-start-3">
                {context.resolvedObject.asset.after && (
                  <AssetInfo
                    projectId={context.project.id}
                    asset={context.resolvedObject.asset.after}
                    language={context.user.language}
                  />
                )}
              </div>
            )}

            {!context.resolvedObject.asset.after && (
              <div className="col-span-6 col-start-3">
                {context.resolvedObject.asset.before && (
                  <AssetInfo
                    projectId={context.project.id}
                    asset={context.resolvedObject.asset.before}
                    language={context.user.language}
                  />
                )}
              </div>
            )}

            {context.resolvedObject.asset.before &&
              context.resolvedObject.asset.after && (
                <>
                  <div className="col-span-6">
                    <h3 className="text-center text-white mb-4">Before</h3>
                    {context.resolvedObject.asset.before && (
                      <AssetInfo
                        projectId={context.project.id}
                        asset={context.resolvedObject.asset.before}
                        language={context.user.language}
                      />
                    )}
                  </div>

                  <div className="col-span-6">
                    <h3 className="text-center text-white mb-4">After</h3>
                    {context.resolvedObject.asset.after && (
                      <AssetInfo
                        projectId={context.project.id}
                        asset={context.resolvedObject.asset.after}
                        language={context.user.language}
                      />
                    )}
                  </div>
                </>
              )}
          </>
        );
      }
      default:
        return <>Object changes</>;
    }
  }

  function Description(): ReactElement {
    return (
      <>
        <div className="flex items-center">
          <Avatar name={context.commit.author.name} className="mr-2" />
          <div className="leading-4">
            <div>{context.commit.author.name}</div>
            <div>
              {
                formatDatetime(context.commit.datetime, context.user.language)
                  .relative
              }
            </div>
          </div>
        </div>
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
      {/* {JSON.stringify(context.commit)} */}
      <div className="grid grid-cols-12 gap-6">
        <DisplayChanges />
      </div>
    </Page>
  );
}
