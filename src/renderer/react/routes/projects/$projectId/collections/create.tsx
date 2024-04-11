import {
  TextValueDefinitionForm,
  TextValueDefinitionFormExample,
} from '@/renderer/react/components/forms/text-value-definition-form';
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
  SupportedLanguage,
  TextValueDefinition,
  ValueDefinition,
  createCollectionSchema,
  supportedIconSchema,
  textValueDefinitionSchema,
  uuid,
  valueDefinitionSchema,
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
  const [isAddValueDefinitionModalOpen, setIsAddValueDefinitionModalOpen] =
    useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(
    context.currentUser.locale.id
  );
  const defaultProjectLocaleId =
    context.currentProject.settings.locale.default.id;

  // console.log('Project', context.currentProject.settings.locale);
  // console.log('supportedProjectLocaleDefaults', supportedProjectLocaleDefaults);

  const textValueDefinitionFormState = useForm<TextValueDefinition>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      console.log(
        'TextValueDefinition validation result',
        await zodResolver(textValueDefinitionSchema)(data, context, options)
      );
      return zodResolver(textValueDefinitionSchema)(data, context, options);
    },
    defaultValues: {
      id: uuid(),
      name: {
        [selectedLanguage]: '',
      },
      description: {
        [selectedLanguage]: '',
      },
      valueType: 'string',
      inputType: 'text',
      inputWidth: '12',
      defaultValue: '',
      min: 0,
      max: 250,
      isRequired: true,
      isUnique: false,
      isDisabled: false,
    },
  });

  const valueDefinitionForm = useForm<ValueDefinition>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      console.log('formData', data);
      console.log(
        'validation result',
        await zodResolver(valueDefinitionSchema)(data, context, options)
      );
      return zodResolver(valueDefinitionSchema)(data, context, options);
    },
    defaultValues: {
      id: uuid(),
      valueType: 'string',
      inputType: 'text',
      inputWidth: '3',
      defaultValue: '',
      min: 0,
      max: 255,
      isRequired: true,
      isUnique: false,
      isDisabled: false,
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
          [selectedLanguage]: '',
        },
        plural: {
          [selectedLanguage]: '',
        },
      },
      description: {
        [selectedLanguage]: '',
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
        <Button onClick={createCollectionForm.handleSubmit(onCreate)}>
          <Check className="w-4 h-4 mr-2"></Check>
          Create Collection
        </Button>
      </>
    );
  }

  const onCreate: SubmitHandler<CreateCollectionProps> = async (
    createCollectionProps
  ) => {
    try {
      const collection = await context.core.collections.create(
        createCollectionProps
      );
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
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to create new collection',
        description: 'There was an error creating the new Collection.',
      });
    }
  };

  const onAddValueDefinition: SubmitHandler<ValueDefinition> = (definition) => {
    console.log();
    console.log('Adding Value definition: ', definition);
    valueDefinitions.append(definition);
    setIsAddValueDefinitionModalOpen(false);
    console.log('New Collection props: ', createCollectionForm.getValues());
    // @todo resetting the new Field form values is not working right now
    // newFieldDefinition.reset(defaultFieldDefinition);
  };

  return (
    <Page
      title={`Create a new Collection`}
      description={<Description></Description>}
      actions={<Actions></Actions>}
      layout="overlap-card-no-space"
    >
      <Form {...createCollectionForm}>
        <form onSubmit={createCollectionForm.handleSubmit(onCreate)}>
          <div className="space-y-4 p-8">
            <div className="grid grid-cols-12 gap-6">
              <FormField
                control={createCollectionForm.control}
                name={`name.plural.${defaultProjectLocaleId}`}
                render={({ field }) => (
                  <FormItem className="col-span-12 sm:col-span-6">
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
                name={`name.singular.${defaultProjectLocaleId}`}
                render={({ field }) => (
                  <FormItem className="col-span-12 sm:col-span-6">
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
                name={`icon`}
                render={({ field }) => (
                  <FormItem className="col-span-12 sm:col-span-3">
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
                name={`description.${defaultProjectLocaleId}`}
                render={({ field }) => (
                  <FormItem className="col-span-12 sm:col-span-9">
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
                open={isAddValueDefinitionModalOpen}
                onOpenChange={setIsAddValueDefinitionModalOpen}
              >
                <SheetTrigger asChild>
                  <Button
                    onClick={(event) => {
                      event.preventDefault();
                      setIsAddValueDefinitionModalOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2"></Plus>
                    Add Value definition
                  </Button>
                </SheetTrigger>
                <SheetContent
                  overlayChildren={
                    valueDefinitionForm.watch('inputType') === 'text' && (
                      <TextValueDefinitionFormExample
                        state={textValueDefinitionFormState}
                        currentLanguage="en"
                      ></TextValueDefinitionFormExample>
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
                      <div className="px-6">
                        <FormField
                          control={valueDefinitionForm.control}
                          name={`inputType`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={field.onChange}
                                  {...field}
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select an icon" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="textarea">
                                      Textarea
                                    </SelectItem>
                                    <SelectItem value="number">
                                      Number
                                    </SelectItem>
                                    <SelectItem value="range">Range</SelectItem>
                                    <SelectItem value="toggle">
                                      Toggle
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {valueDefinitionForm.watch('inputType') === 'text' && (
                          <TextValueDefinitionForm
                            state={textValueDefinitionFormState}
                            currentLanguage="en"
                          ></TextValueDefinitionForm>
                        )}
                      </div>
                    </ScrollArea>
                  </SheetBody>

                  <SheetFooter>
                    <Button
                      className="w-full"
                      onClick={textValueDefinitionFormState.handleSubmit(
                        onAddValueDefinition
                      )}
                    >
                      Add definition
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            }
          >
            <div className="grid grid-cols-12 gap-6 mt-6">
              {valueDefinitions.fields.map(
                (fieldDefinition, fieldDefinitionIndex) => {
                  return (
                    <div
                      key={fieldDefinition.id}
                      className={`col-span-12 ${fieldWidth(
                        fieldDefinition.inputWidth
                      )}`}
                    >
                      <div className="border rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm">
                        <h3 className="font-medium text-gray-700">
                          {fieldDefinition.name[context.currentUser.locale.id]}{' '}
                          ({fieldDefinition.inputType})
                        </h3>
                        <p className="text-sm text-gray-500">
                          {
                            fieldDefinition.description[
                              context.currentUser.locale.id
                            ]
                          }
                        </p>
                      </div>
                    </div>
                  );
                }
              )}
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
