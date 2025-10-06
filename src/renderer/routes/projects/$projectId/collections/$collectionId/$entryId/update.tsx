import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';

import { CreateUpdateEntryPage } from '@renderer/components/pages/create-update-entry-page';
import { Button } from '@renderer/components/ui/button';
import { NotificationIntent, useStore } from '@renderer/store';

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
  const routeContext = Route.useRouteContext();
  const addNotification = useStore((state) => state.addNotification);
  const [isUpdatingEntry, setIsUpdatingEntry] = useState(false);
  const generatedUpdateEntrySchema = getUpdateEntrySchemaFromFieldDefinitions(
    routeContext.currentCollection.fieldDefinitions
  );

  const updateEntryForm = useForm<UpdateEntryProps>({
    resolver: async (data, context, options) => {
      routeContext.core.logger.debug('Update Entry form data', data);
      const validationResult = await zodResolver(generatedUpdateEntrySchema)(
        data,
        context,
        options
      );
      routeContext.core.logger.debug(
        'Update Entry form validation result',
        validationResult
      );
      return validationResult;
    },
    defaultValues: {
      ...routeContext.currentEntry,
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
      collectionId: routeContext.currentCollection.id,
      projectId: routeContext.project.id,
    },
  });

  // @todo Should map to a Value defined by the user (which could also be used in the Collection index page and breadcrumb to always show a "title" of the Entry)
  // context.translate(
  //   'currentCollection.name.plural',
  //   context.currentEntry.values[0].content
  // );
  const title = routeContext.currentEntry.id;

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
          {routeContext.translateContent(
            'currentCollection.name.singular',
            routeContext.currentCollection.name.singular
          )}
        </Button>
      </>
    );
  }

  const onUpdateEntry: SubmitHandler<UpdateEntryProps> = async (entry) => {
    setIsUpdatingEntry(true);

    try {
      await routeContext.core.entries.update(entry);
      setIsUpdatingEntry(false);
      addNotification({
        intent: NotificationIntent.SUCCESS,
        title: `Updated ${routeContext.translateContent(
          'currentCollection.name',
          routeContext.currentCollection.name.singular
        )}`,
        description: 'The Entry has been updated.',
      });
      router.navigate({
        to: '/projects/$projectId/collections/$collectionId',
        params: {
          projectId: routeContext.project.id,
          collectionId: routeContext.currentCollection.id,
        },
      });
    } catch (error) {
      setIsUpdatingEntry(false);
      routeContext.core.logger.error('Failed to update Entry', error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to update Entry',
        description: 'There was an error updating the Entry.',
      });
    }
  };

  return (
    <CreateUpdateEntryPage
      title={title}
      description={<Description />}
      actions={<Actions />}
      entryForm={updateEntryForm}
      fieldDefinitions={routeContext.currentCollection.fieldDefinitions}
      supportedLanguages={routeContext.project.settings.language.supported}
      defaultLanguage={routeContext.project.settings.language.default}
      translateContent={routeContext.translateContent}
      onFormSubmit={onUpdateEntry}
    />
  );
}
