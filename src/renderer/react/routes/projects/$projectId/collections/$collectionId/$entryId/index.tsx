import {
  ValueInputFromDefinition,
  translatableDefault,
} from '@/renderer/react/components/forms/util';
import { Button } from '@/renderer/react/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/renderer/react/components/ui/form';
import { Page } from '@/renderer/react/components/ui/page';
import { fieldWidth } from '@/util';
import { UpdateEntryProps, updateEntrySchema } from '@elek-io/shared';
import { NotificationIntent } from '@elek-io/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { ReactElement, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId/$entryId/'
)({
  component: ProjectCollectionEntryIndexPage,
});

function ProjectCollectionEntryIndexPage() {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = context.store((state) => state.addNotification);
  const [isUpdatingEntry, setIsUpdatingEntry] = useState(false);

  const updateEntryFormState = useForm<UpdateEntryProps>({
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
      values: context.currentCollection.valueDefinitions.map(
        (definition, index) => {
          return {
            objectType: 'value',
            definitionId: definition.id,
            valueType: definition.valueType,
            content:
              context.currentEntry.values[index]?.content ||
              translatableDefault({
                supportedLanguages:
                  context.currentProject.settings.language.supported,
                default: definition.valueType === 'string' ? '' : null,
              }),
          };
        }
      ),
      collectionId: context.currentCollection.id,
      projectId: context.currentProject.id,
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
          isLoading={isUpdatingEntry}
          onClick={updateEntryFormState.handleSubmit(onUpdate)}
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
      await context.core.entries.update({
        ...entry,
      });
      setIsUpdatingEntry(false);
      router.navigate({
        to: '/projects/$projectId/collections/$collectionId/$entryId',
        params: {
          projectId: context.currentProject.id,
          collectionId: context.currentCollection.id,
          entryId: context.currentEntry.id,
        },
      });
    } catch (error) {
      setIsUpdatingEntry(false);
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to update Entry',
        description: 'There was an error updating the Entry.',
      });
    }
  };

  return (
    <Page
      title={Title()}
      description={<Description></Description>}
      actions={<Actions></Actions>}
    >
      {JSON.stringify(updateEntryFormState.watch())}
      <Form {...updateEntryFormState}>
        <form>
          {context.currentCollection.valueDefinitions.map(
            (definition, definitionIndex) => {
              return (
                <FormField
                  key={definition.id}
                  name={`values.${definitionIndex}.content.${context.currentProject.settings.language.default}`}
                  render={({ field }) => (
                    <FormItem
                      className={`col-span-12 ${fieldWidth(
                        definition.inputWidth
                      )}`}
                    >
                      <FormLabel
                        isRequired={
                          'isRequired' in definition
                            ? definition.isRequired
                            : false
                        }
                      >
                        {context.translate(
                          'definition.label',
                          definition.label
                        )}
                      </FormLabel>
                      <FormControl>
                        {ValueInputFromDefinition<UpdateEntryProps>(
                          definition,
                          updateEntryFormState,
                          field
                        )}
                      </FormControl>
                      <FormDescription>
                        {context.translate(
                          'definition.description',
                          definition.description
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              );
            }
          )}
        </form>
      </Form>
    </Page>
  );
}
