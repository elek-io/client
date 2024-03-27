import {
  CreateEntryProps,
  ValueDefinition,
  createEntrySchema,
} from '@elek-io/shared';
import { NotificationIntent } from '@elek-io/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { ReactElement } from 'react';
import { ControllerRenderProps, SubmitHandler, useForm } from 'react-hook-form';
import { Button } from '../../../../../components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../../../components/ui/form';
import { Input } from '../../../../../components/ui/input';
import { Page } from '../../../../../components/ui/page';
import { Textarea } from '../../../../../components/ui/textarea';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId/create'
)({
  component: ProjectCollectionEntryCreate,
});

function ProjectCollectionEntryCreate() {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = context.store((state) => state.addNotification);

  const createEntryForm = useForm<CreateEntryProps>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      console.log('formData', data);
      console.log(
        'validation result',
        await zodResolver(createEntrySchema)(data, context, options)
      );
      return zodResolver(createEntrySchema)(data, context, options);
    },
    defaultValues: {
      projectId: context.currentProject.id,
      collectionId: context.currentCollection.id,
      language: context.currentProject.settings.locale.default.id,
      valueReferences: [],
    },
  });

  const onCreate: SubmitHandler<CreateEntryProps> = async (
    createEntryProps
  ) => {
    try {
      const entry = await context.core.entries.create(createEntryProps);
      addNotification({
        intent: NotificationIntent.SUCCESS,
        title: 'Created new Entry for this Collection',
        description: '',
      });
      router.navigate({
        to: '/projects/$projectId/collections/$collectionId/$entryId/$entryLanguage',
        params: {
          projectId: context.currentProject.id,
          collectionId: context.currentCollection.id,
          entryId: entry.id,
          entryLanguage: entry.language,
        },
      });
    } catch (error) {
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to create new Entry for this Collection',
        description:
          'There was an error creating the new Entry for this Collection.',
      });
    }
  };

  function Title(): string {
    return `Create a new ${context.translate(
      'currentCollection.name',
      context.currentCollection.name.singular
    )}`;
  }

  function Description(): ReactElement {
    if (!context.currentCollection) {
      return <></>;
    }
    return (
      <>
        {context.translate(
          'currentCollection.description',
          context.currentCollection.description
        )}
      </>
    );
  }

  function Actions(): ReactElement {
    return (
      <>
        <Button onClick={createEntryForm.handleSubmit(onCreate)}>
          <Check className="h-4 w-4 mr-2"></Check>
          Create{' '}
          {context.translate(
            'currentCollection.name.singular',
            context.currentCollection.name.singular
          )}
        </Button>
      </>
    );
  }

  function EntryInput(
    definition: ValueDefinition,
    field: ControllerRenderProps<CreateEntryProps>
  ): ReactElement {
    switch (definition.inputType) {
      case 'text':
        return <Input {...field} />;
      case 'textarea':
        return <Textarea {...field} />;
      default:
        console.error(
          `Unsupported Entry definition inputType "${definition.inputType}"`
        );
        break;
    }
  }

  return (
    <Page
      title={Title()}
      description={<Description></Description>}
      actions={<Actions></Actions>}
    >
      <Form {...createEntryForm}>
        <form onSubmit={createEntryForm.handleSubmit(onCreate)}>
          {/* <FormSelect
          name="language"
          label="Language"
          control={control}
          options={[
            {
              name: 'English',
              value: 'en',
            },
            {
              name: 'Deutsch',
              value: 'de',
            },
          ]}
          description="The language of this item"
          errors={errors}
        ></FormSelect> */}

          {
            // The Collections Field definitions are displayed here, so the user can either create a new field based on the definition or choose an existing one that matches the criterea
          }
          <div className="grid grid-cols-12 gap-x-4 gap-y-8 sm:gap-x-6 xl:gap-x-8">
            {context.currentCollection &&
              context.currentCollection.valueDefinitions.map((definition) => {
                return (
                  <FormField
                    control={createEntryForm.control}
                    name={`something`}
                    render={({ field }) => (
                      <FormItem
                        className={`col-span-12 sm:col-span-${definition.inputWidth}`}
                      >
                        <FormLabel>
                          {context.translate(
                            'definition.name',
                            definition.name
                          )}
                        </FormLabel>
                        <FormControl>
                          {EntryInput(definition, field)}
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
              })}
          </div>

          {/* <h2>Definitions</h2>
            <ul>
              {context.currentCollection.fieldDefinitions.map((fieldDefinition) => {
                return <li>{fieldDefinition.name[props.currentUser.locale.id]}</li>;
              })}
            </ul> */}
        </form>
      </Form>
    </Page>
  );
}
