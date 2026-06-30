import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import React, { useEffect, type ReactElement } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';

import { EntryForm } from '@renderer/components/forms/entry-form';
import { Page } from '@renderer/components/page';
import { Button } from '@renderer/components/ui/button';
import { useBreadcrumb } from '@renderer/hooks/useBreadcrumb';
import { useProject } from '@renderer/hooks/useProject';
import { useQueryNoError } from '@renderer/hooks/useQueryNoError';
import { translatableDefault } from '@renderer/lib/utils';
import { queryOptions } from '@renderer/queries';

import {
  type CreateEntryProps,
  flattenFieldDefinitions,
  getCreateEntrySchemaFromFieldDefinitions,
} from '@elek-io/core';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId/create'
)({
  component: CreateEntryPage,
});

function CreateEntryPage(): React.JSX.Element {
  const router = useRouter();
  const { projectId, collectionId } = Route.useParams();
  const {
    projectQuery: { data: project, isPending: isReadingProject },
    translateContent,
  } = useProject();
  const { data: collection, isPending: isReadingCollection } = useQueryNoError(
    queryOptions.collections.read({
      projectId: projectId,
      id: collectionId,
    })
  );
  useBreadcrumb(Route, isReadingCollection ? undefined : 'Create');
  const { mutateAsync: createEntry, isPending: isCreatingEntry } = useMutation(
    queryOptions.entries.create
  );
  const generatedCreateEntrySchema =
    isReadingProject === false && isReadingCollection === false
      ? getCreateEntrySchemaFromFieldDefinitions(
          flattenFieldDefinitions(collection.fieldDefinitions),
          project.settings.language.supported
        )
      : getCreateEntrySchemaFromFieldDefinitions([], []);
  const createEntryForm = useForm<CreateEntryProps>({
    resolver: zodResolver(generatedCreateEntrySchema),
    defaultValues: {
      projectId: projectId,
      collectionId: collectionId,
      values: {},
    },
  });

  // Reset form with Project and Collection data when it loads
  useEffect(() => {
    if (isReadingProject === false && isReadingCollection === false) {
      createEntryForm.reset({
        projectId: projectId,
        collectionId: collectionId,
        values: Object.fromEntries(
          flattenFieldDefinitions(collection.fieldDefinitions).map((definition) => {
            switch (definition.valueType) {
              case 'boolean':
              case 'number':
              case 'string':
                return [
                  definition.slug,
                  {
                    objectType: 'value',
                    valueType: definition.valueType,
                    content: translatableDefault({
                      supportedLanguages: project.settings.language.supported,
                      defaultValue: definition.defaultValue,
                    }),
                  },
                ];

              case 'reference':
                return [
                  definition.slug,
                  {
                    objectType: 'value',
                    valueType: definition.valueType,
                    content: translatableDefault({
                      supportedLanguages: project.settings.language.supported,
                      defaultValue: [],
                    }),
                  },
                ];

              default:
                throw new Error(
                  `Unsupported valueType "${definition.valueType}" while setting form state defaults for creating the Entry`
                );
            }
          })
        ),
      });
    }
  }, [
    projectId,
    collectionId,
    project,
    collection,
    isReadingProject,
    isReadingCollection,
    createEntryForm,
  ]);

  const onCreateEntry: SubmitHandler<CreateEntryProps> = async (props) => {
    await createEntry(props);
    await router.navigate({
      to: '/projects/$projectId/collections/$collectionId',
      params: {
        projectId,
        collectionId,
      },
    });
  };

  const title = `Create a new ${
    collection
      ? translateContent({
          key: 'currentCollection.name',
          record: collection.name.singular,
        })
      : 'Entry'
  }`;

  function Description(): ReactElement {
    return (
      <>
        {collection
          ? translateContent({
              key: 'currentCollection.description',
              record: collection.description,
            })
          : ''}
      </>
    );
  }

  function Actions(): ReactElement {
    return (
      <>
        <Button
          Icon={Check}
          isLoading={isCreatingEntry}
          disabled={createEntryForm.formState.isDirty === false}
          onClick={createEntryForm.handleSubmit(onCreateEntry)}
        >
          Create{' '}
          {collection
            ? translateContent({
                key: 'currentCollection.name.singular',
                record: collection.name.singular,
              })
            : 'Entry'}
        </Button>
      </>
    );
  }

  if (isReadingProject || isReadingCollection) {
    return <></>;
  }

  return (
    <Page title={title} description={<Description />} actions={<Actions />}>
      <EntryForm
        entryForm={createEntryForm}
        fieldDefinitions={collection.fieldDefinitions}
        project={project}
        isViewOnly={isCreatingEntry}
        onFormSubmit={onCreateEntry}
      />
    </Page>
  );
}
