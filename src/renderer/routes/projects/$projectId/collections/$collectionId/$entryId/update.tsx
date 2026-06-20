import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { useEffect, type ReactElement } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';

import { EntryForm } from '@renderer/components/forms/entry-form';
import { Page } from '@renderer/components/page';
import { Button } from '@renderer/components/ui/button';
import { useBreadcrumb } from '@renderer/hooks/useBreadcrumb';
import { useProject } from '@renderer/hooks/useProject';
import { useQueryNoError } from '@renderer/hooks/useQueryNoError';
import { queryOptions } from '@renderer/queries';

import {
  getUpdateEntrySchemaFromFieldDefinitions,
  type UpdateEntryProps,
} from '@elek-io/core';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId/$entryId/update'
)({
  component: UpdateEntryPage,
});

function UpdateEntryPage(): ReactElement {
  const router = useRouter();
  const { projectId, collectionId, entryId } = Route.useParams();
  useBreadcrumb(Route, 'Update');
  const {
    projectQuery: { data: project, isPending: isReadingProject },
    translateContent,
  } = useProject();
  const { data: collection, isPending: isReadingCollection } = useQueryNoError(
    queryOptions.collections.read({
      projectId,
      id: collectionId,
    })
  );
  const { data: entry, isPending: isReadingEntry } = useQueryNoError(
    queryOptions.entries.read({
      projectId,
      collectionId,
      id: entryId,
    })
  );
  const { mutateAsync: updateEntry, isPending: isUpdatingEntry } = useMutation(
    queryOptions.entries.update
  );
  const generatedUpdateEntrySchema =
    collection && project
      ? getUpdateEntrySchemaFromFieldDefinitions(
          collection.fieldDefinitions,
          project.settings.language.supported
        )
      : getUpdateEntrySchemaFromFieldDefinitions([], []);

  const updateEntryForm = useForm<UpdateEntryProps>({
    resolver: zodResolver(generatedUpdateEntrySchema),
    defaultValues: {
      id: entryId,
      values: {},
    },
  });

  // Reset form with Project and Collection data when it loads
  useEffect(() => {
    if (isReadingEntry === false) {
      updateEntryForm.reset({
        ...entry,
        // @todo Maybe we need to add missing values here
        // values: context.currentCollection.fieldDefinitions.map(
        //   (definition, index) => {
        //     return {
        //       objectType: 'value',
        //       definitionId: definition.id,
        //       valueType: definition.valueType,
        //       content: context.currentEntry.values[index]?.content,
        //     };
        //   }
        // ),
        projectId,
        collectionId,
      });
    }
  }, [collectionId, entry, isReadingEntry, projectId, updateEntryForm]);

  const onUpdateEntry: SubmitHandler<UpdateEntryProps> = async (entry) => {
    await updateEntry(entry);
    await router.navigate({
      to: '/projects/$projectId/collections/$collectionId',
      params: {
        projectId,
        collectionId,
      },
    });
  };

  // @todo Should map to a Value defined by the user (which could also be used in the Collection index page and breadcrumb to always show a "title" of the Entry)
  // context.translate(
  //   'currentCollection.name.plural',
  //   context.currentEntry.values[0].content
  // );
  const title = entry ? entry.id : '';

  function Description(): ReactElement {
    return <>Here you can edit this Entries Values</>;
  }

  function Actions(): ReactElement {
    return (
      <>
        <Button
          Icon={Check}
          isLoading={isUpdatingEntry}
          disabled={updateEntryForm.formState.isDirty === false}
          onClick={updateEntryForm.handleSubmit(onUpdateEntry)}
        >
          Update{' '}
          {collection
            ? translateContent({
                key: 'collection.name.singular',
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
        entryForm={updateEntryForm}
        fieldDefinitions={collection.fieldDefinitions}
        project={project}
        isViewOnly={isReadingEntry || isUpdatingEntry}
        onFormSubmit={onUpdateEntry}
      />
    </Page>
  );
}
