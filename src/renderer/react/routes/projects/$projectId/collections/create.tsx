import {
  CreateCollectionProps,
  ValueDefinition,
  createCollectionSchema,
  supportedIconSchema,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../../components/ui/dialog';
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
import { Switch } from '../../../../components/ui/switch';
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
  const defaultProjectLocaleId =
    context.currentProject.settings.locale.default.id;
  /**
   * Provides empty defaults for all supported languages.
   * Needed for controlled form fields
   */
  const supportedProjectLocaleDefaults =
    context.currentProject.settings.locale.supported
      .map((locale) => {
        return {
          [locale.id]: '',
        };
      })
      .reduce((prev, curr) => {
        return {
          ...prev,
          ...curr,
        };
      });

  // console.log('Project', context.currentProject.settings.locale);
  // console.log('supportedProjectLocaleDefaults', supportedProjectLocaleDefaults);

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
        singular: supportedProjectLocaleDefaults,
        plural: supportedProjectLocaleDefaults,
      },
      description: supportedProjectLocaleDefaults,
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
        <form
          onSubmit={createCollectionForm.handleSubmit(onCreate)}
          className="space-y-8"
        >
          <FormField
            control={createCollectionForm.control}
            name={`icon`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Icon</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} {...field}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select an icon" />
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
            name={`name.plural.${defaultProjectLocaleId}`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Blogposts" {...field} />
                </FormControl>
                <FormDescription>
                  The name of your new collection. Choose a short name in plural
                  that explains the content of the collection - e.g.
                  "Blogposts".
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
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
          />

          <FormField
            control={createCollectionForm.control}
            name={`name.singular.${defaultProjectLocaleId}`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name of each Entry</FormLabel>
                <FormControl>
                  <Input placeholder="Blogpost" {...field} />
                </FormControl>
                <FormDescription>
                  The name of each Entry inside your new Collection. Choose a
                  short name in singluar - e.g. "Blogpost".
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
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
                  Entry's name. It's used to identify this Collection's Entries
                  and needs to be unique.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={createCollectionForm.control}
            name={`description.${defaultProjectLocaleId}`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="This Collection contains individual posts that are displayed inside our blog."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  A description of what this new Collection is used for.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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
              <Dialog
                open={isAddValueDefinitionModalOpen}
                onOpenChange={setIsAddValueDefinitionModalOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    onClick={(event) => {
                      event.preventDefault();
                      setIsAddValueDefinitionModalOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2"></Plus>
                    Add Value definition
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add a new Value definition</DialogTitle>
                    <DialogDescription>
                      Choose what type the new Value of this Collection is going
                      to be.
                    </DialogDescription>
                  </DialogHeader>
                  <p>
                    ToDo: Field type should be a grid with visual representation
                    of the different types available
                  </p>
                  <FormField
                    control={valueDefinitionForm.control}
                    name={`valueType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} {...field}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select an icon" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="string">String</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="boolean">Boolean</SelectItem>
                              <SelectItem value="asset">Asset</SelectItem>
                              <SelectItem value="list">List</SelectItem>
                              <SelectItem value="reference">
                                Reference
                              </SelectItem>
                              <SelectItem value="slug">Slug</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <p>
                    ToDo: From here on there should be an input field visible
                    that is configured like the user specified. It should also
                    scroll down and up with the user
                  </p>
                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-8">
                      <FormField
                        control={valueDefinitionForm.control}
                        name={`id`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID</FormLabel>
                            <FormControl>
                              <Input placeholder="blogpost" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={valueDefinitionForm.control}
                        name={`name.${defaultProjectLocaleId}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Title" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={valueDefinitionForm.control}
                        name={`description.${defaultProjectLocaleId}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormDescription>
                              Describe what to input into this field. This text
                              will be displayed under the field to guide users
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <hr className="p-2" />

                      <FormField
                        control={valueDefinitionForm.control}
                        name={`isRequired`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Required</FormLabel>
                            <FormControl>
                              <Switch
                                {...field}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormDescription>
                              Required fields need to be filled before a
                              CollectionItem can be created or updated
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={valueDefinitionForm.control}
                        name={`isUnique`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unique</FormLabel>
                            <FormControl>
                              <Switch
                                {...field}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormDescription>
                              You won't be able to create an Entry if there is
                              an existing Entry with identical content
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={valueDefinitionForm.control}
                        name={`inputWidth`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field width</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} {...field}>
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Select an icon" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="3">3/12</SelectItem>
                                  <SelectItem value="4">4/12</SelectItem>
                                  <SelectItem value="6">6/12</SelectItem>
                                  <SelectItem value="12">12/12</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-4">
                      <div className="sticky top-6">
                        <FormField
                          control={valueDefinitionForm.control}
                          // @ts-ignore: This is just the example input
                          name={`example`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {valueDefinitionForm.watch(
                                  `name.${defaultProjectLocaleId}`
                                ) || 'Example'}
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="blogpost" {...field} />
                              </FormControl>
                              <FormDescription>
                                {valueDefinitionForm.watch(
                                  `description.${defaultProjectLocaleId}`
                                )}
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={valueDefinitionForm.handleSubmit(
                      onAddValueDefinition
                    )}
                  >
                    Add Field definition
                  </Button>
                </DialogContent>
              </Dialog>
            }
          >
            <div className="grid grid-cols-12 gap-6 mt-6">
              {valueDefinitions.fields.map(
                (fieldDefinition, fieldDefinitionIndex) => {
                  return (
                    <div
                      key={fieldDefinition.id}
                      className={`col-span-12 sm:col-span-${fieldDefinition.inputWidth}`}
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
            <p>
              Dynamic Field generation. See
              https://react-hook-form.com/api/usefieldarray/
            </p>
            {JSON.stringify(createCollectionForm.watch())}
          </PageSection>
        </form>
      </Form>
    </Page>
  );
}
