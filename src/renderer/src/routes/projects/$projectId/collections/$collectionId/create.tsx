import { CreateEntryProps, createEntrySchema } from '@elek-io/core';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FormFieldFromDefinition,
  translatableDefaultArray,
  translatableDefaultNull,
} from '@renderer/components/forms/util';
import { Button } from '@renderer/components/ui/button';
import { Form } from '@renderer/components/ui/form';
import { Page } from '@renderer/components/ui/page';
import { NotificationIntent, useStore } from '@renderer/store';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { ReactElement, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId/create'
)({
  component: ProjectCollectionEntryCreatePage,
});

function ProjectCollectionEntryCreatePage(): JSX.Element {
  const router = useRouter();
  const context = Route.useRouteContext();
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);
  const addNotification = useStore((state) => state.addNotification);

  const createEntryForm = useForm<CreateEntryProps>({
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
      projectId: context.project.id,
      collectionId: context.currentCollection.id,
      values: context.currentCollection.fieldDefinitions.map((definition) => {
        switch (definition.valueType) {
          case 'boolean':
          case 'number':
          case 'string':
            return {
              objectType: 'value',
              fieldDefinitionId: definition.id,
              valueType: definition.valueType,
              content: translatableDefaultNull({
                supportedLanguages: context.project.settings.language.supported,
              }),
            };

          case 'reference':
            return {
              objectType: 'value',
              fieldDefinitionId: definition.id,
              valueType: definition.valueType,
              content: translatableDefaultArray({
                supportedLanguages: context.project.settings.language.supported,
              }),
            };

          default:
            throw new Error(
              // @ts-expect-error Since usually it's not reachable
              `Unsupported valueType "${definition.valueType}" while setting form state defaults for creating the Entry`
            );
        }
      }),
    },
  });

  const onCreateEntry: SubmitHandler<CreateEntryProps> = async (props) => {
    setIsCreatingEntry(true);

    try {
      const entry = await context.core.entries.create(props);
      setIsCreatingEntry(false);
      addNotification({
        intent: NotificationIntent.SUCCESS,
        title: 'Created new Entry for this Collection',
        description: '',
      });
      router.navigate({
        to: '/projects/$projectId/collections/$collectionId/$entryId',
        params: {
          projectId: context.project.id,
          collectionId: context.currentCollection.id,
          entryId: entry.id,
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
    return `Create a new ${context.translateContent(
      'currentCollection.name',
      context.currentCollection.name.singular
    )}`;
  }

  function Description(): ReactElement {
    return (
      <>
        {context.translateContent(
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
          onClick={createEntryForm.handleSubmit(onCreateEntry)}
        >
          <Check className="h-4 w-4 mr-2"></Check>
          Create{' '}
          {context.translateContent(
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
      <Form {...createEntryForm}>
        <form>
          {JSON.stringify(createEntryForm.watch())}
          {
            // The Collections Field definitions are displayed here, so the user can either create a new field based on the definition or choose an existing one that matches the criterea
          }
          <div className="p-6 grid grid-cols-12 gap-x-4 gap-y-8 sm:gap-x-6 xl:gap-x-8">
            {context.currentCollection.fieldDefinitions.map(
              (fieldDefinition, index) => {
                // return <p>{JSON.stringify(fieldDefinition)}</p>;
                return (
                  <FormFieldFromDefinition
                    key={fieldDefinition.id}
                    fieldDefinition={fieldDefinition}
                    name={`values.${index}.content.${context.project.settings.language.default}`}
                    translateContent={context.translateContent}
                  />
                );
              }
            )}
            {/* {context.currentCollection.fieldDefinitions.map(
              (definition, index) => {
                return (
                  <FormField
                    key={definition.id}
                    control={createEntryFormState.control}
                    name={`values.${index}.content.${context.currentProject.settings.language.default}`}
                    render={({ field }) => (
                      <FormItem
                        className={`col-span-12 ${fieldWidth(
                          definition.inputWidth
                        )}`}
                      >
                        <FormLabel isRequired={true}>
                          {context.translate(
                            'definition.label',
                            definition.label
                          )}
                        </FormLabel>
                        <FormControl>
                          <Dialog>
                            <DialogTrigger asChild>
                              {InputFromDefinition<CreateEntryProps>(
                                definition,
                                createEntryFormState,
                                field
                              )}
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  {context.translate(
                                    'definition.label',
                                    definition.label
                                  )}
                                </DialogTitle>
                                <DialogDescription>
                                  {context.translate(
                                    'definition.description',
                                    definition.description
                                  )}
                                </DialogDescription>
                              </DialogHeader>

                              {context.currentProject.settings.language.supported.map(
                                (language) => {
                                  return (
                                    <FormField
                                      key={language}
                                      control={createEntryFormState.control}
                                      name={`values.${index}.content.${language}`}
                                      render={({ field }) => (
                                        <FormItem className="col-span-12 sm:col-span-5">
                                          <FormLabel isRequired={true}>
                                            {language}
                                          </FormLabel>
                                          <FormControl>
                                            {InputFromDefinition<CreateEntryProps>(
                                              definition,
                                              createEntryFormState,
                                              field
                                            )}
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  );
                                }
                              )}

                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button type="button" variant="secondary">
                                    Done
                                  </Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
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
            )} */}
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
