import {
  type Asset,
  type Collection,
  type Entry,
  type GitCommit,
  type Project,
} from '@elek-io/core';
import { AssetInfo } from '@renderer/components/ui/asset-info';
import { Badge } from '@renderer/components/ui/badge';
import { CollectionDiff } from '@renderer/components/ui/collection-diff';
import { DiffContainer } from '@renderer/components/ui/diff-container';
import { EntryDiff } from '@renderer/components/ui/entry-diff';
import { Page } from '@renderer/components/ui/page';
import { ProjectDiff } from '@renderer/components/ui/project-diff';
import { createFileRoute } from '@tanstack/react-router';
import { Tag } from 'lucide-react';
import { type ReactElement } from 'react';

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
      project: {
        before: (Project & { commit: GitCommit }) | undefined;
        after: (Project & { commit: GitCommit }) | undefined;
      };
      asset: {
        before: (Asset & { commit: GitCommit }) | undefined;
        after: (Asset & { commit: GitCommit }) | undefined;
      };
      collection: {
        before: (Collection & { commit: GitCommit }) | undefined;
        after: (Collection & { commit: GitCommit }) | undefined;
      };
      entry: {
        collection: Collection | undefined;
        before: (Entry & { commit: GitCommit }) | undefined;
        after: (Entry & { commit: GitCommit }) | undefined;
      };
    } = {
      project: {
        before: undefined,
        after: undefined,
      },
      asset: {
        before: undefined,
        after: undefined,
      },
      collection: {
        before: undefined,
        after: undefined,
      },
      entry: {
        collection: undefined,
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
              commit.message.reference.objectType === 'project' &&
              commit.message.reference.id === commit.message.reference.id
          );
          const currentCommitIndex = projectCommitHistory.findIndex(
            (commit) => commit.hash === params.commitHash
          );
          const commitBefore = projectCommitHistory.at(currentCommitIndex + 1);
          if (!commitBefore) {
            throw new Error('Commit not found in Project history');
          }
          const projectBefore = await context.core.projects.read({
            id: context.project.id,
            commitHash: commitBefore.hash,
          });
          resolvedObject.project.before = {
            ...projectBefore,
            commit: commitBefore,
          };
        }

        if (commit.message.method !== 'delete') {
          const project = await context.core.projects.read({
            id: context.project.id,
            commitHash: commit.hash,
          });
          resolvedObject.project.after = {
            ...project,
            commit: commit,
          };
        }
        break;
      }
      case 'asset': {
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
          const commitBefore = assetCommitHistory.at(currentCommitIndex + 1);
          if (!commitBefore) {
            throw new Error('Commit not found in Asset history');
          }
          const assetBefore = await context.core.assets.read({
            projectId: context.project.id,
            id: commit.message.reference.id,
            commitHash: assetCommitHistory.at(currentCommitIndex + 1)?.hash,
          });
          resolvedObject.asset.before = {
            ...assetBefore,
            commit: commitBefore,
          };
        }

        if (commit.message.method !== 'delete') {
          const asset = await context.core.assets.read({
            projectId: context.project.id,
            id: commit.message.reference.id,
            commitHash: commit.hash,
          });
          resolvedObject.asset.after = {
            ...asset,
            commit: commit,
          };
        }
        break;
      }
      case 'collection': {
        if (
          commit.message.method === 'update' ||
          commit.message.method === 'delete'
        ) {
          const collectionCommitHistory = context.project.fullHistory.filter(
            (commit) =>
              commit.message.reference.objectType === 'collection' &&
              commit.message.reference.id === commit.message.reference.id
          );
          const currentCommitIndex = collectionCommitHistory.findIndex(
            (commit) => commit.hash === params.commitHash
          );
          const commitBefore = collectionCommitHistory.at(
            currentCommitIndex + 1
          );
          if (!commitBefore) {
            throw new Error('Commit not found in Collection history');
          }
          const collectionBefore = await context.core.collections.read({
            projectId: context.project.id,
            id: commit.message.reference.id,
            commitHash: collectionCommitHistory.at(currentCommitIndex + 1)
              ?.hash,
          });
          resolvedObject.collection.before = {
            ...collectionBefore,
            commit: commitBefore,
          };
        }

        if (commit.message.method !== 'delete') {
          const collection = await context.core.collections.read({
            projectId: context.project.id,
            id: commit.message.reference.id,
            commitHash: commit.hash,
          });
          resolvedObject.collection.after = {
            ...collection,
            commit: commit,
          };
        }
        break;
      }
      case 'entry': {
        if (!commit.message.reference.collectionId) {
          throw new Error('Commit for Entry does not contain a collectionId');
        }
        const collection = await context.core.collections.read({
          projectId: context.project.id,
          id: commit.message.reference.collectionId,
        });
        if (!collection) {
          throw new Error(
            `No Collection with ID "${commit.message.reference.collectionId}" found`
          );
        }
        resolvedObject.entry.collection = collection;

        if (
          commit.message.method === 'update' ||
          commit.message.method === 'delete'
        ) {
          const entryCommitHistory = context.project.fullHistory.filter(
            (commit) =>
              commit.message.reference.objectType === 'entry' &&
              commit.message.reference.id === commit.message.reference.id
          );
          const currentCommitIndex = entryCommitHistory.findIndex(
            (commit) => commit.hash === params.commitHash
          );
          const commitBefore = entryCommitHistory.at(currentCommitIndex + 1);
          if (!commitBefore) {
            throw new Error('Commit not found in Entry history');
          }
          const entryBefore = await context.core.entries.read({
            projectId: context.project.id,
            collectionId: commit.message.reference.collectionId,
            id: commit.message.reference.id,
            commitHash: entryCommitHistory.at(currentCommitIndex + 1)?.hash,
          });
          resolvedObject.entry.before = {
            ...entryBefore,
            commit: commitBefore,
          };
        }

        if (commit.message.method !== 'delete') {
          if (!commit.message.reference.collectionId) {
            throw new Error('Commit for Entry does not contain a collectionId');
          }
          const entry = await context.core.entries.read({
            projectId: context.project.id,
            collectionId: commit.message.reference.collectionId,
            id: commit.message.reference.id,
            commitHash: commit.hash,
          });
          resolvedObject.entry.after = {
            ...entry,
            commit: commit,
          };
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
            {!context.resolvedObject.project.before &&
              context.resolvedObject.project.after && (
                <DiffContainer
                  type="create"
                  commit={context.resolvedObject.project.after.commit}
                  language={context.user.language}
                >
                  <ProjectDiff project={context.resolvedObject.project.after} />
                </DiffContainer>
              )}

            {!context.resolvedObject.project.after &&
              context.resolvedObject.project.before && (
                <DiffContainer
                  type="delete"
                  commit={context.resolvedObject.project.before.commit}
                  language={context.user.language}
                >
                  <ProjectDiff
                    project={context.resolvedObject.project.before}
                  />
                </DiffContainer>
              )}

            {context.resolvedObject.project.before &&
              context.resolvedObject.project.after && (
                <>
                  <DiffContainer
                    type="before"
                    commit={context.resolvedObject.project.before.commit}
                    language={context.user.language}
                  >
                    <ProjectDiff
                      project={context.resolvedObject.project.before}
                    />
                  </DiffContainer>

                  <DiffContainer
                    type="after"
                    commit={context.resolvedObject.project.after.commit}
                    language={context.user.language}
                  >
                    <ProjectDiff
                      project={context.resolvedObject.project.after}
                    />
                  </DiffContainer>
                </>
              )}
          </>
        );
      }
      case 'asset': {
        return (
          <>
            {!context.resolvedObject.asset.before &&
              context.resolvedObject.asset.after && (
                <DiffContainer
                  type="create"
                  commit={context.resolvedObject.asset.after.commit}
                  language={context.user.language}
                >
                  <AssetInfo
                    projectId={context.project.id}
                    language={context.user.language}
                    asset={context.resolvedObject.asset.after}
                  />
                </DiffContainer>
              )}

            {!context.resolvedObject.asset.after &&
              context.resolvedObject.asset.before && (
                <DiffContainer
                  type="delete"
                  commit={context.resolvedObject.asset.before.commit}
                  language={context.user.language}
                >
                  <AssetInfo
                    projectId={context.project.id}
                    language={context.user.language}
                    asset={context.resolvedObject.asset.before}
                  />
                </DiffContainer>
              )}

            {context.resolvedObject.asset.before &&
              context.resolvedObject.asset.after && (
                <>
                  <DiffContainer
                    type="before"
                    commit={context.resolvedObject.asset.before.commit}
                    language={context.user.language}
                  >
                    <AssetInfo
                      projectId={context.project.id}
                      language={context.user.language}
                      asset={context.resolvedObject.asset.before}
                    />
                  </DiffContainer>

                  <DiffContainer
                    type="after"
                    commit={context.resolvedObject.asset.after.commit}
                    language={context.user.language}
                  >
                    <AssetInfo
                      projectId={context.project.id}
                      language={context.user.language}
                      asset={context.resolvedObject.asset.after}
                    />
                  </DiffContainer>
                </>
              )}
          </>
        );
      }
      case 'collection': {
        return (
          <>
            {!context.resolvedObject.collection.before &&
              context.resolvedObject.collection.after && (
                <DiffContainer
                  type="create"
                  commit={context.resolvedObject.collection.after.commit}
                  language={context.user.language}
                >
                  <CollectionDiff
                    collection={context.resolvedObject.collection.after}
                    language={context.user.language}
                    translateContent={context.translateContent}
                  />
                </DiffContainer>
              )}

            {!context.resolvedObject.collection.after &&
              context.resolvedObject.collection.before && (
                <DiffContainer
                  type="delete"
                  commit={context.resolvedObject.collection.before.commit}
                  language={context.user.language}
                >
                  <CollectionDiff
                    collection={context.resolvedObject.collection.before}
                    language={context.user.language}
                    translateContent={context.translateContent}
                  />
                </DiffContainer>
              )}

            {context.resolvedObject.collection.before &&
              context.resolvedObject.collection.after && (
                <>
                  <DiffContainer
                    type="before"
                    commit={context.resolvedObject.collection.before.commit}
                    language={context.user.language}
                  >
                    <CollectionDiff
                      collection={context.resolvedObject.collection.before}
                      language={context.user.language}
                      translateContent={context.translateContent}
                    />
                  </DiffContainer>

                  <DiffContainer
                    type="after"
                    commit={context.resolvedObject.collection.after.commit}
                    language={context.user.language}
                  >
                    <CollectionDiff
                      collection={context.resolvedObject.collection.after}
                      language={context.user.language}
                      translateContent={context.translateContent}
                    />
                  </DiffContainer>
                </>
              )}
          </>
        );
      }
      case 'entry': {
        return (
          <>
            {!context.resolvedObject.entry.before &&
              context.resolvedObject.entry.after && (
                <DiffContainer
                  type="create"
                  commit={context.resolvedObject.entry.after.commit}
                  language={context.user.language}
                >
                  <EntryDiff
                    collection={context.resolvedObject.entry.collection!}
                    entry={context.resolvedObject.entry.after}
                    language={context.user.language}
                    translateContent={context.translateContent}
                  />
                </DiffContainer>
              )}

            {!context.resolvedObject.entry.after &&
              context.resolvedObject.entry.before && (
                <DiffContainer
                  type="delete"
                  commit={context.resolvedObject.entry.before.commit}
                  language={context.user.language}
                >
                  <EntryDiff
                    collection={context.resolvedObject.entry.collection!}
                    entry={context.resolvedObject.entry.before}
                    language={context.user.language}
                    translateContent={context.translateContent}
                  />
                </DiffContainer>
              )}

            {context.resolvedObject.entry.before &&
              context.resolvedObject.entry.after && (
                <>
                  <DiffContainer
                    type="before"
                    commit={context.resolvedObject.entry.before.commit}
                    language={context.user.language}
                  >
                    <EntryDiff
                      collection={context.resolvedObject.entry.collection!}
                      entry={context.resolvedObject.entry.before}
                      language={context.user.language}
                      translateContent={context.translateContent}
                    />
                  </DiffContainer>

                  <DiffContainer
                    type="after"
                    commit={context.resolvedObject.entry.after.commit}
                    language={context.user.language}
                  >
                    <EntryDiff
                      collection={context.resolvedObject.entry.collection!}
                      entry={context.resolvedObject.entry.after}
                      language={context.user.language}
                      translateContent={context.translateContent}
                    />
                  </DiffContainer>
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
