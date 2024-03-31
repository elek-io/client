import { fieldWidth } from '@/util';
import {
  CreateEntryProps,
  CreateValueProps,
  ValueDefinition,
  createValueSchema,
} from '@elek-io/shared';
import { NotificationIntent } from '@elek-io/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { ReactElement } from 'react';
import { ControllerRenderProps, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
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

  const createValuesForm = useForm<{ values: CreateValueProps[] }>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      console.log('formData', data);
      console.log(
        'validation result',
        await zodResolver(z.object({ values: z.array(createValueSchema) }))(
          data,
          context,
          options
        )
      );
      return zodResolver(z.object({ values: z.array(createValueSchema) }))(
        data,
        context,
        options
      );
    },
    defaultValues: {
      values: context.currentCollection.valueDefinitions.map((definition) => {
        return {
          projectId: context.currentProject.id,
          language: context.currentProject.settings.locale.default.id,
          valueType: definition.valueType,
          content: '',
        };
      }),
    },
  });

  const onCreateValues: SubmitHandler<{ values: CreateValueProps[] }> = async (
    props
  ) => {
    try {
      const valuesToCreate = props.values.map((valueProps) => {
        return context.core.values.create(valueProps);
      });
      const values = await Promise.all(valuesToCreate);

      console.log('boo');

      await createEntry({
        projectId: context.currentProject.id,
        collectionId: context.currentCollection.id,
        language: context.currentProject.settings.locale.default.id,
        valueReferences: values.map((value, index) => {
          return {
            // @todo Check if this is reliable: this mapping of created values to their definitions relies on the order of given values to be exaclty in the ordner of it's definition
            definitionId: context.currentCollection.valueDefinitions[index].id,
            references: { id: value.id, language: value.language },
          };
        }),
      });
    } catch (error) {
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to create new Values for this Entry',
        description:
          'There was an error creating the new Values for this Entry.',
      });
    }
  };

  const createEntry = async (props: CreateEntryProps) => {
    try {
      const entry = await context.core.entries.create(props);
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
        <Button onClick={createValuesForm.handleSubmit(onCreateValues)}>
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

  function ValueInput(
    definition: ValueDefinition,
    field: ControllerRenderProps<
      { values: CreateValueProps[] },
      `values.${number}.content`
    >
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
      <Form {...createValuesForm}>
        <form>
          {JSON.stringify(createValuesForm.watch())}
          {
            // The Collections Field definitions are displayed here, so the user can either create a new field based on the definition or choose an existing one that matches the criterea
          }
          <div className="grid grid-cols-12 gap-x-4 gap-y-8 sm:gap-x-6 xl:gap-x-8">
            {context.currentCollection.valueDefinitions.map(
              (definition, index) => {
                return (
                  <>
                    {/* {JSON.stringify(definition)} */}
                    <FormField
                      control={createValuesForm.control}
                      name={`values.${index}.content`}
                      render={({ field }) => (
                        <FormItem
                          className={`col-span-12 ${fieldWidth(
                            definition.inputWidth
                          )}`}
                        >
                          <FormLabel>
                            {context.translate(
                              'definition.name',
                              definition.name
                            )}
                          </FormLabel>
                          <FormControl>
                            {ValueInput(definition, field)}
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
                  </>
                );
              }
            )}
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
