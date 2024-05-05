import { ValueInputFromDefinition } from '@/renderer/react/components/forms/util';
import { fieldWidth } from '@/util';
import { CreateEntryProps, createEntrySchema } from '@elek-io/shared';
import { NotificationIntent } from '@elek-io/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { ReactElement, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
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
import { Page } from '../../../../../components/ui/page';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId/create'
)({
  component: ProjectCollectionEntryCreatePage,
});

function ProjectCollectionEntryCreatePage() {
  const router = useRouter();
  const context = Route.useRouteContext();
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);
  const addNotification = context.store((state) => state.addNotification);

  const createEntryFormState = useForm<CreateEntryProps>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      console.log('create Entry form formData', data);
      console.log(
        'create Entry form validation result',
        await zodResolver(createEntrySchema)(data, context, options)
      );

      // @todo Add full client side zod validation when creating an Entry - including it's Values (@see https://github.com/elek-io/client/issues/7)
      return zodResolver(createEntrySchema)(data, context, options);
    },
    defaultValues: {
      projectId: context.currentProject.id,
      collectionId: context.currentCollection.id,
      language: context.currentProject.settings.locale.default.id,
      values: context.currentCollection.valueDefinitions.map((definition) => {
        switch (definition.valueType) {
          case 'boolean':
          case 'number':
          case 'string':
            return {
              objectType: 'value',
              definitionId: definition.id,
              valueType: definition.valueType,
              content: definition.defaultValue || undefined,
            };

          case 'reference':
            return {
              objectType: 'value',
              definitionId: definition.id,
              valueType: definition.valueType,
              content: undefined,
            };

          default:
            throw new Error(
              // @ts-ignore Property 'valueType' does not exist on type 'never' as long as we always implement all possible valueTypes
              `Unsupported valueType "${definition.valueType}" while setting form state defaults for creating the Entry`
            );
        }
      }),
    },
  });

  const onCreateEntry: SubmitHandler<CreateEntryProps> = async (data) => {
    setIsCreatingEntry(true);

    try {
      const entry = await context.core.entries.create(data);
      setIsCreatingEntry(false);
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
      setIsCreatingEntry(false);
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to create new Entry for this Collection',
        description:
          'There was an error creating the new Entry for this Collection.',
      });
    }
  };

  // const createValuesForm = useForm<{ values: CreateSharedValueProps[] }>({
  //   resolver: async (data, context, options) => {
  //     // you can debug your validation schema here
  //     console.log('formData', data);
  //     console.log(
  //       'validation result',
  //       await zodResolver(
  //         z.object({ values: z.array(createSharedValueSchema) })
  //       )(data, context, options)
  //     );
  //     return zodResolver(
  //       z.object({ values: z.array(createSharedValueSchema) })
  //     )(data, context, options);
  //   },
  //   defaultValues: {
  //     values: context.currentCollection.valueDefinitions.map((definition) => {
  //       const baseDefaultDefinition: CreateEntryProps['values'][number] = {
  //         projectId: context.currentProject.id,
  //         language: context.currentProject.settings.locale.default.id,
  //         valueType: definition.valueType,
  //         content: null as any,
  //       };

  //       switch (definition.valueType) {
  //         case ValueTypeSchema.Enum.reference:
  //           break;
  //         case ValueTypeSchema.Enum.boolean:
  //           baseDefaultDefinition.content = definition.defaultValue || false;
  //           break;
  //         case ValueTypeSchema.Enum.number:
  //           baseDefaultDefinition.content = definition.defaultValue || 0;
  //           break;
  //         case ValueTypeSchema.Enum.string:
  //           baseDefaultDefinition.content = definition.defaultValue || '';
  //           break;
  //         default:
  //           break;
  //       }
  //       return baseDefaultDefinition;
  //     }),
  //   },
  // });

  // const onCreateValues: SubmitHandler<{
  //   values: CreateSharedValueProps[];
  // }> = async (props) => {
  //   try {
  //     const valuesToCreate = props.values.map((valueProps) => {
  //       return context.core.sharedValues.create(valueProps);
  //     });
  //     const values = await Promise.all(valuesToCreate);

  //     console.log('boo');

  //     await createEntry({
  //       projectId: context.currentProject.id,
  //       collectionId: context.currentCollection.id,
  //       language: context.currentProject.settings.locale.default.id,
  //       values: values.map((value, index) => {
  //         return {
  //           // @todo Check if this is reliable: this mapping of created values to their definitions relies on the order of given values to be exaclty in the ordner of it's definition
  //           definitionId: context.currentCollection.valueDefinitions[index].id,
  //           references: { id: value.id, language: value.language },
  //         };
  //       }),
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     addNotification({
  //       intent: NotificationIntent.DANGER,
  //       title: 'Failed to create new Values for this Entry',
  //       description:
  //         'There was an error creating the new Values for this Entry.',
  //     });
  //   }
  // };

  // const createEntry = async (props: CreateEntryProps) => {
  //   try {
  //     const entry = await context.core.entries.create(props);
  //     addNotification({
  //       intent: NotificationIntent.SUCCESS,
  //       title: 'Created new Entry for this Collection',
  //       description: '',
  //     });
  //     router.navigate({
  //       to: '/projects/$projectId/collections/$collectionId/$entryId/$entryLanguage',
  //       params: {
  //         projectId: context.currentProject.id,
  //         collectionId: context.currentCollection.id,
  //         entryId: entry.id,
  //         entryLanguage: entry.language,
  //       },
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     addNotification({
  //       intent: NotificationIntent.DANGER,
  //       title: 'Failed to create new Entry for this Collection',
  //       description:
  //         'There was an error creating the new Entry for this Collection.',
  //     });
  //   }
  // };

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
        <Button
          isLoading={isCreatingEntry}
          onClick={createEntryFormState.handleSubmit(onCreateEntry)}
        >
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

  return (
    <Page
      title={Title()}
      description={<Description></Description>}
      actions={<Actions></Actions>}
    >
      <Form {...createEntryFormState}>
        <form>
          {JSON.stringify(createEntryFormState.watch())}
          {
            // The Collections Field definitions are displayed here, so the user can either create a new field based on the definition or choose an existing one that matches the criterea
          }
          <div className="p-6 grid grid-cols-12 gap-x-4 gap-y-8 sm:gap-x-6 xl:gap-x-8">
            {context.currentCollection.valueDefinitions.map(
              (definition, index) => {
                return (
                  <FormField
                    key={definition.id}
                    control={createEntryFormState.control}
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
                          {ValueInputFromDefinition<CreateEntryProps>(
                            definition,
                            createEntryFormState,
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
