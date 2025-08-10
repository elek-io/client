import { type UpdateEntryProps, updateEntrySchema } from '@elek-io/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormFieldFromDefinition } from '@renderer/components/forms/util';
import { Button } from '@renderer/components/ui/button';
import { Form } from '@renderer/components/ui/form';
import { Page } from '@renderer/components/ui/page';
import { NotificationIntent, useStore } from '@renderer/store';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId/$entryId/update'
)({
  component: ProjectCollectionEntryUpdatePage,
});

function ProjectCollectionEntryUpdatePage(): ReactElement {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = useStore((state) => state.addNotification);
  const [isUpdatingEntry, setIsUpdatingEntry] = useState(false);

  const updateEntryForm = useForm<UpdateEntryProps>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      console.log('formData', data);
      console.log(
        'validation result',
        await zodResolver(updateEntrySchema)(data, context, options)
      );
      return zodResolver(updateEntrySchema)(data, context, options);
    },
    defaultValues: {
      ...context.currentEntry,
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
      collectionId: context.currentCollection.id,
      projectId: context.project.id,
    },
  });

  function Title(): string {
    // @todo Should map to a Value defined by the user (which could also be used in the Collection index page and breadcrumb to always show a "title" of the Entry)
    // return context.translate(
    //   'currentCollection.name.plural',
    //   context.currentEntry.values[0].content
    // );
    return context.currentEntry.id;
  }

  function Description(): ReactElement {
    return <>Here you can edit this Entries Values</>;
  }

  function Actions(): ReactElement {
    return (
      <>
        <Button
          onClick={updateEntryForm.handleSubmit(onUpdate)}
          isLoading={isUpdatingEntry}
          disabled={updateEntryForm.formState.isDirty === false}
        >
          <Check className="w-4 h-4 mr-2"></Check>
          Save changes
        </Button>
      </>
    );
  }

  const onUpdate: SubmitHandler<UpdateEntryProps> = async (entry) => {
    setIsUpdatingEntry(true);
    try {
      await context.core.entries.update(entry);
      addNotification({
        intent: NotificationIntent.SUCCESS,
        title: 'Successfully updated Entry',
        description: 'The Entry has been updated.',
      });
      router.navigate({
        to: '/projects/$projectId/collections/$collectionId',
        params: {
          projectId: context.project.id,
          collectionId: context.currentCollection.id,
        },
      });
    } catch (error) {
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to update Entry',
        description: 'There was an error updating the Entry.',
      });
    } finally {
      setIsUpdatingEntry(false);
    }
  };

  return (
    <Page
      title={Title()}
      description={<Description></Description>}
      actions={<Actions></Actions>}
    >
      {/* {JSON.stringify(updateEntryFormState.watch())} */}
      <Form {...updateEntryForm}>
        <form onSubmit={updateEntryForm.handleSubmit(onUpdate)}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-12 gap-6">
              {context.currentCollection.fieldDefinitions.map(
                (definition, definitionIndex) => {
                  return (
                    <FormFieldFromDefinition
                      key={definition.id}
                      fieldDefinition={definition}
                      name={`values.${definitionIndex}.content.${context.project.settings.language.default}`}
                      translateContent={context.translateContent}
                    />
                  );
                }
              )}
            </div>
          </div>
        </form>
      </Form>
    </Page>
  );
}
