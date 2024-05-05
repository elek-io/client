import {
  NumberValueDefinitionForm,
  NumberValueDefinitionFormFieldExample,
} from '@/renderer/react/components/forms/number-value-definition-form';
import { ValueInputFromDefinition } from '@/renderer/react/components/forms/util';
import { ScrollArea } from '@/renderer/react/components/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/renderer/react/components/ui/sheet';
import { fieldWidth } from '@/util';
import {
  CreateCollectionProps,
  NumberValueDefinition,
  ValueDefinitionBase,
  ValueInputType,
  ValueInputTypeSchema,
  createCollectionSchema,
  numberValueDefinitionSchema,
  supportedIconSchema,
  uuid,
} from '@elek-io/shared';
import { NotificationIntent } from '@elek-io/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check, Plus } from 'lucide-react';
import { ReactElement, useState } from 'react';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { Button } from '../../../../components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../../components/ui/form';
import { Input } from '../../../../components/ui/input';
import { Page } from '../../../../components/ui/page';
import { PageSection } from '../../../../components/ui/page-section';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { Textarea } from '../../../../components/ui/textarea';

export const Route = createFileRoute('/projects/$projectId/collections/create')(
  {
    component: ProjectCollectionCreate,
  }
);

function ProjectCollectionCreate() {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = context.store((state) => state.addNotification);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [isAddValueDefinitionSheetOpen, setIsAddValueDefinitionSheetOpen] =
    useState(false);
  const [selectedInputType, setSelectedInputType] =
    useState<ValueInputType>('text');
  // const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(
  //   context.currentUser.language
  // );
  const defaultProjectLanguage =
    context.currentProject.settings.language.default;

  const valueDefinitionBaseDefaults: Omit<ValueDefinitionBase, 'id'> = {
    name: {
      [defaultProjectLanguage]: '',
    },
    description: {
      [defaultProjectLanguage]: '',
    },
    isRequired: false,
    isDisabled: false,
    inputWidth: '12',
  };

  // const textValueDefinitionFormState = useForm<TextValueDefinition>({
  //   resolver: async (data, context, options) => {
  //     // you can debug your validation schema here
  //     console.log(
  //       'TextValueDefinition validation result',
  //       await zodResolver(textValueDefinitionSchema)(data, context, options)
  //     );
  //     return zodResolver(textValueDefinitionSchema)(data, context, options);
  //   },
  //   defaultValues: {
  //     ...valueDefinitionBaseDefaults,
  //     id: uuid(),
  //     valueType: 'string',
  //     inputType: 'text',
  //     defaultValue: '',
  //     min: 0,
  //     max: 250,
  //     isUnique: false,
  //   },
  // });

  const numberValueDefinitionFormState = useForm<NumberValueDefinition>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      console.log(
        'NumberValueDefinition validation result',
        await zodResolver(numberValueDefinitionSchema)(data, context, options)
      );
      return zodResolver(numberValueDefinitionSchema)(data, context, options);
    },
    defaultValues: {
      ...valueDefinitionBaseDefaults,
      id: uuid(),
      valueType: 'number',
      inputType: 'number',
      defaultValue: undefined,
      min: undefined,
      max: undefined,
      isUnique: false,
    },
  });

  const createCollectionForm = useForm<CreateCollectionProps>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      console.log('formData', data);
      console.log(
        'validation result',
        await zodResolver(createCollectionSchema)(data, context, options)
      );
      return zodResolver(createCollectionSchema)(data, context, options);
    },
    defaultValues: {
      projectId: context.currentProject.id,
      icon: 'home',
      name: {
        singular: {
          [defaultProjectLanguage]: '',
        },
        plural: {
          [defaultProjectLanguage]: '',
        },
      },
      description: {
        [defaultProjectLanguage]: '',
      },
      slug: {
        singular: '',
        plural: '',
      },
      valueDefinitions: [],
    },
  });

  const valueDefinitions = useFieldArray({
    control: createCollectionForm.control, // control props comes from useForm (optional: if you are using FormContext)
    name: 'valueDefinitions', // unique name for your Field Array
  });

  function Description(): ReactElement {
    return (
      <>
        A Collection holds information about how your content is structured.
        <br></br>
        Read more about{' '}
        <a href="#" className="text-brand-600 hover:underline">
          Collections in the documentation
        </a>
        .
      </>
    );
  }

  function Actions(): ReactElement {
    return (
      <>
        <Button
          isLoading={isCreatingCollection}
          onClick={createCollectionForm.handleSubmit(onCreate)}
        >
          <Check className="w-4 h-4 mr-2"></Check>
          Create Collection
        </Button>
      </>
    );
  }

  const onCreate: SubmitHandler<CreateCollectionProps> = async (
    createCollectionProps
  ) => {
    setIsCreatingCollection(true);
    try {
      const collection = await context.core.collections.create(
        createCollectionProps
      );
      setIsCreatingCollection(false);
      addNotification({
        intent: NotificationIntent.SUCCESS,
        title: 'Created new collection',
        description: 'You can now create Entries for this new Collection.',
      });
      router.navigate({
        to: '/projects/$projectId/collections/$collectionId',
        params: {
          projectId: context.currentProject.id,
          collectionId: collection.id,
        },
      });
    } catch (error) {
      setIsCreatingCollection(false);
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to create new collection',
        description: 'There was an error creating the new Collection.',
      });
    }
  };

  async function validateValueDefinition() {
    switch (selectedInputType) {
      // case 'text':
      //   return await textValueDefinitionFormState.handleSubmit(
      //     (textDefinition) => {
      //       valueDefinitions.append(textDefinition);
      //       setIsAddValueDefinitionSheetOpen(false);
      //       textValueDefinitionFormState.reset();
      //       textValueDefinitionFormState.setValue('id', uuid());
      //     }
      //   )();
      case 'number':
        return await numberValueDefinitionFormState.handleSubmit(
          (numberDefinition) => {
            valueDefinitions.append(numberDefinition);
            setIsAddValueDefinitionSheetOpen(false);
            numberValueDefinitionFormState.reset();
            numberValueDefinitionFormState.setValue('id', uuid());
          }
        )();
      default:
        throw new Error(
          `Tried to validate unsupported inputType "${selectedInputType}" of Value definition`
        );
    }
  }

  return (
    <Page
      title={`Create a new Collection`}
      description={<Description></Description>}
      actions={<Actions></Actions>}
    >
      {/* <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {supportedLanguageSchema.options.map((option) => {
            return (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select> */}
      <Form {...createCollectionForm}>
        <form onSubmit={createCollectionForm.handleSubmit(onCreate)}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-12 gap-6">
              <FormField
                control={createCollectionForm.control}
                name={`icon`}
                render={({ field }) => (
                  <FormItem className="col-span-12 sm:col-span-2">
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} {...field}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {supportedIconSchema.options.map((option) => {
                            return (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={createCollectionForm.control}
                name={`name.plural.${defaultProjectLanguage}`}
                render={({ field }) => (
                  <FormItem className="col-span-12 sm:col-span-5">
                    <FormLabel>Name (Plural)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of your new collection. Choose a short name in
                      plural that explains the content of the collection - e.g.
                      "Blogposts".
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createCollectionForm.control}
                name={`name.singular.${defaultProjectLanguage}`}
                render={({ field }) => (
                  <FormItem className="col-span-12 sm:col-span-5">
                    <FormLabel>Name (Singluar)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of each Entry inside your new Collection. Choose
                      a short name in singluar - e.g. "Blogpost".
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createCollectionForm.control}
                name={`description.${defaultProjectLanguage}`}
                render={({ field }) => (
                  <FormItem className="col-span-12 sm:col-span-12">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormDescription>
                      A description of what this new Collection is used for.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* <FormField
              control={createCollectionForm.control}
              name={`slug.plural`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collection-Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="blogposts" {...field} />
                  </FormControl>
                  <FormDescription>
                    A lowercase version without any special characters of the
                    Collection name. It's used to identify this Collection and
                    needs to be unique.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

            {/* <FormField
              control={createCollectionForm.control}
              name={`slug.singular`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entry-Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="blogpost" {...field} />
                  </FormControl>
                  <FormDescription>
                    A lowercase version without any special characters of the
                    Entry's name. It's used to identify this Collection's
                    Entries and needs to be unique.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
          </div>

          <PageSection
            title="Define this Collections Values"
            description="Here you can define what the Collections content looks like. Add
              Value definitions to structure the Collections content and add
              input definitions to define how users interact with those
              Values. For example you can create a Value `createdAt` of type
              `date` which atomatically restricts the input to only allow
              dates being inserted. Additionally this shows a datepicker UI to
              help users selecting a date."
            actions={
              <Sheet
                open={isAddValueDefinitionSheetOpen}
                onOpenChange={setIsAddValueDefinitionSheetOpen}
              >
                <SheetTrigger asChild>
                  <Button
                    onClick={(event) => {
                      event.preventDefault();
                      setIsAddValueDefinitionSheetOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2"></Plus>
                    Add Value definition
                  </Button>
                </SheetTrigger>
                <SheetContent
                  // @todo Uncomment to not close the Sheet when clicking into the example inputs - this needs some work, since then it's also not possible to use the example input
                  //
                  // onInteractOutside={(event) => {
                  //   console.log(event);
                  //   event.preventDefault();
                  // }}
                  overlayChildren={
                    selectedInputType === 'number' && (
                      <NumberValueDefinitionFormFieldExample
                        state={numberValueDefinitionFormState}
                        currentLanguage="en"
                      ></NumberValueDefinitionFormFieldExample>
                    )
                  }
                >
                  <SheetHeader>
                    <SheetTitle>Add a new Value definition</SheetTitle>
                    <SheetDescription>
                      Choose what type the new Value of this Collection is going
                      to be.
                    </SheetDescription>
                  </SheetHeader>

                  <SheetBody>
                    <ScrollArea>
                      <div className="px-6 py-1 space-y-6">
                        <FormItem>
                          <FormLabel>Input type</FormLabel>
                          <Select
                            value={selectedInputType}
                            onValueChange={(value: ValueInputType) =>
                              setSelectedInputType(value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ValueInputTypeSchema.options.map((option) => {
                                return (
                                  <SelectItem value={option}>
                                    {option}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The type of input for the Value.
                          </FormDescription>
                        </FormItem>

                        {selectedInputType === 'number' && (
                          <NumberValueDefinitionForm
                            state={numberValueDefinitionFormState}
                            currentLanguage="en"
                          ></NumberValueDefinitionForm>
                        )}
                      </div>
                    </ScrollArea>
                  </SheetBody>

                  <SheetFooter>
                    <Button
                      className="w-full"
                      onClick={validateValueDefinition}
                    >
                      Add definition
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            }
          >
            <div className="grid grid-cols-12 gap-6 mt-6">
              {valueDefinitions.fields.map((definition, definitionIndex) => {
                return (
                  <FormField
                    key={definition.id}
                    name={`valueDefinitions.${definitionIndex}.content`}
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
                          {ValueInputFromDefinition<CreateCollectionProps>(
                            definition,
                            createCollectionForm,
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
              })}
            </div>
            {/* <p>
              Dynamic Field generation. See
              https://react-hook-form.com/api/usefieldarray/
            </p>
            {JSON.stringify(createCollectionForm.watch())} */}
          </PageSection>
        </form>
      </Form>
    </Page>
  );
}
