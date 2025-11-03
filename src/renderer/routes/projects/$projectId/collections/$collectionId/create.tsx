import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';

import { CreateUpdateEntryPage } from '@renderer/components/pages/create-update-entry-page';
import {
  translatableDefaultEmptyArray,
  translatableDefaultNull,
} from '@renderer/components/pages/util';
import { Button } from '@renderer/components/ui/button';
import { NotificationIntent, useStore } from '@renderer/store';

import {
  type CreateEntryProps,
  getCreateEntrySchemaFromFieldDefinitions,
} from '@elek-io/core';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId/create'
)({
  component: CreateEntryPage,
});

function CreateEntryPage(): ReactElement {
  const router = useRouter();
  const routeContext = Route.useRouteContext();
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);
  const addNotification = useStore((state) => state.addNotification);
  const generatedCreateEntrySchema = getCreateEntrySchemaFromFieldDefinitions(
    routeContext.currentCollection.fieldDefinitions
  );

  const createEntryForm = useForm<CreateEntryProps>({
    resolver: async (data, context, options) => {
      routeContext.core.logger.debug({
        source: 'desktop',
        message: 'Create Entry form data',
        meta: { data },
      });
      const validationResult = await zodResolver(generatedCreateEntrySchema)(
        // @ts-expect-error TS does not know the at runtime generated value schema and assumes it's an empty array
        data,
        context,
        options
      );
      routeContext.core.logger.debug({
        source: 'desktop',
        message: 'Create Entry form validation result',
        meta: { validationResult },
      });
      return validationResult;
    },
    defaultValues: {
      projectId: routeContext.project.id,
      collectionId: routeContext.currentCollection.id,
      values: routeContext.currentCollection.fieldDefinitions.map(
        (definition) => {
          switch (definition.valueType) {
            case 'boolean':
            case 'number':
            case 'string':
              return {
                objectType: 'value',
                fieldDefinitionId: definition.id,
                valueType: definition.valueType,
                content: translatableDefaultNull(
                  routeContext.project.settings.language.supported
                ),
              };

            case 'reference':
              return {
                objectType: 'value',
                fieldDefinitionId: definition.id,
                valueType: definition.valueType,
                content: translatableDefaultEmptyArray(
                  routeContext.project.settings.language.supported
                ),
              };

            default:
              throw new Error(
                // @ts-expect-error Since usually it's not reachable
                `Unsupported valueType "${definition.valueType}" while setting form state defaults for creating the Entry`
              );
          }
        }
      ),
    },
  });

  const title = `Create a new ${routeContext.translateContent(
    'currentCollection.name',
    routeContext.currentCollection.name.singular
  )}`;

  function Description(): ReactElement {
    return (
      <>
        {routeContext.translateContent(
          'currentCollection.description',
          routeContext.currentCollection.description
        )}
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
          {routeContext.translateContent(
            'currentCollection.name.singular',
            routeContext.currentCollection.name.singular
          )}
        </Button>
      </>
    );
  }

  const onCreateEntry: SubmitHandler<CreateEntryProps> = async (props) => {
    setIsCreatingEntry(true);

    try {
      await routeContext.core.entries.create(props);
      setIsCreatingEntry(false);
      addNotification({
        intent: NotificationIntent.SUCCESS,
        title: `Created new ${routeContext.translateContent(
          'currentCollection.name',
          routeContext.currentCollection.name.singular
        )}`,
        description: 'The Entry has been created.',
      });
      router.navigate({
        to: '/projects/$projectId/collections/$collectionId',
        params: {
          projectId: routeContext.project.id,
          collectionId: routeContext.currentCollection.id,
        },
      });
    } catch (error) {
      setIsCreatingEntry(false);
      routeContext.core.logger.error({
        source: 'desktop',
        message: 'Failed to create new Entry',
        meta: { error },
      });
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to create new Entry',
        description: 'There was an error creating the new Entry.',
      });
    }
  };

  return (
    <CreateUpdateEntryPage
      title={title}
      description={<Description />}
      actions={<Actions />}
      entryForm={createEntryForm}
      fieldDefinitions={routeContext.currentCollection.fieldDefinitions}
      supportedLanguages={routeContext.project.settings.language.supported}
      defaultLanguage={routeContext.project.settings.language.default}
      translateContent={routeContext.translateContent}
      onFormSubmit={onCreateEntry}
    />
  );
}
