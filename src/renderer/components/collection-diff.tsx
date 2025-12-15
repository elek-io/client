import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import {
  DiffContainer,
  DiffContainerSkeleton,
} from '@renderer/components/diff-container';
import { CollectionForm } from '@renderer/components/forms/collection-form';
import { useQueryNoError } from '@renderer/hooks/useQueryNoError';
import { translatableDefault } from '@renderer/lib/utils';
import { queryOptions } from '@renderer/queries';

import {
  updateCollectionSchema,
  type GitCommit,
  type Project,
  type UpdateCollectionProps,
} from '@elek-io/core';

export function CollectionDiff({
  project,
  commit,
}: {
  project: Project;
  commit: GitCommit;
}): React.JSX.Element {
  // Derive commitBefore during render with useMemo
  const commitBefore = useMemo(() => {
    if (commit.message.method === 'create') {
      return undefined;
    }

    const collectionCommitHistory = project.fullHistory.filter(
      (commitFromHistory) =>
        commitFromHistory.message.reference.objectType === 'collection' &&
        commitFromHistory.message.reference.id === commit.message.reference.id
    );
    const currentCommitIndex = collectionCommitHistory.findIndex(
      (commitFromHistory) => commitFromHistory.hash === commit.hash
    );
    const previousCommit = collectionCommitHistory.at(currentCommitIndex + 1);

    if (!previousCommit) {
      throw new Error(
        `No previous commit found for Collection "${commit.message.reference.id}" ` +
          `before "${commit.message.method}" at commit ${commit.hash}`
      );
    }

    return previousCommit;
  }, [commit, project.fullHistory]);

  // Derive commitAfter during render with useMemo
  const commitAfter = useMemo(() => {
    if (commit.message.method === 'delete') {
      return undefined;
    }
    return commit;
  }, [commit]);

  const { data: collectionBefore, isPending: isReadingCollectionBefore } =
    useQueryNoError({
      ...queryOptions.collections.read({
        projectId: project.id,
        id: commit.message.reference.id,
        commitHash: commitBefore?.hash,
      }),
      enabled: commitBefore !== undefined,
    });

  const collectionFormBefore = useForm<UpdateCollectionProps>({
    resolver: zodResolver(updateCollectionSchema),
    defaultValues: {
      projectId: project.id,
      icon: 'home',
      name: {
        singular: translatableDefault({
          supportedLanguages: project.settings.language.supported,
          defaultValue: null,
        }),
        plural: translatableDefault({
          supportedLanguages: project.settings.language.supported,
          defaultValue: null,
        }),
      },
      description: translatableDefault({
        supportedLanguages: project.settings.language.supported,
        defaultValue: null,
      }),
      slug: {
        singular: '',
        plural: '',
      },
      fieldDefinitions: [],
    },
  });

  useEffect(() => {
    if (isReadingCollectionBefore === false) {
      collectionFormBefore.reset(collectionBefore);
    }
  }, [isReadingCollectionBefore, collectionFormBefore, collectionBefore]);

  const { data: collectionAfter, isPending: isReadingCollectionAfter } =
    useQueryNoError({
      ...queryOptions.collections.read({
        projectId: project.id,
        id: commit.message.reference.id,
        commitHash: commitAfter?.hash,
      }),
      enabled: commitAfter !== undefined,
    });

  const collectionFormAfter = useForm<UpdateCollectionProps>({
    resolver: zodResolver(updateCollectionSchema),
    defaultValues: {
      projectId: project.id,
      icon: 'home',
      name: {
        singular: translatableDefault({
          supportedLanguages: project.settings.language.supported,
          defaultValue: null,
        }),
        plural: translatableDefault({
          supportedLanguages: project.settings.language.supported,
          defaultValue: null,
        }),
      },
      description: translatableDefault({
        supportedLanguages: project.settings.language.supported,
        defaultValue: null,
      }),
      slug: {
        singular: '',
        plural: '',
      },
      fieldDefinitions: [],
    },
  });

  useEffect(() => {
    if (isReadingCollectionAfter === false) {
      collectionFormAfter.reset(collectionAfter);
    }
  }, [isReadingCollectionAfter, collectionFormAfter, collectionAfter]);

  // Show loading skeleton while queries are pending
  if (
    (commitBefore && isReadingCollectionBefore) ||
    (commitAfter && isReadingCollectionAfter)
  ) {
    // Show appropriate number of skeletons based on operation
    if (commitBefore && commitAfter) {
      // Update operation - show 2 skeletons
      return (
        <>
          <DiffContainerSkeleton />
          <DiffContainerSkeleton />
        </>
      );
    }
    // Create or delete operation - show 1 centered skeleton
    return <DiffContainerSkeleton centered />;
  }

  // Handle create operation
  if (!commitBefore && commitAfter) {
    return (
      <DiffContainer type="create" commit={commitAfter}>
        <CollectionForm
          project={project}
          collectionForm={collectionFormAfter}
          onFormSubmit={() => {}}
          isViewOnly
        />
      </DiffContainer>
    );
  }

  // Handle delete operation
  if (!commitAfter && commitBefore) {
    return (
      <DiffContainer type="delete" commit={commitBefore}>
        <CollectionForm
          project={project}
          collectionForm={collectionFormBefore}
          onFormSubmit={() => {}}
          isViewOnly
        />
      </DiffContainer>
    );
  }

  // Handle update operation (both commits exist)
  if (commitBefore && commitAfter) {
    return (
      <>
        <DiffContainer type="before" commit={commitBefore}>
          <CollectionForm
            project={project}
            collectionForm={collectionFormBefore}
            onFormSubmit={() => {}}
            isViewOnly
          />
        </DiffContainer>

        <DiffContainer type="after" commit={commitAfter}>
          <CollectionForm
            project={project}
            collectionForm={collectionFormAfter}
            onFormSubmit={() => {}}
            isViewOnly
          />
        </DiffContainer>
      </>
    );
  }

  return <></>;
}
