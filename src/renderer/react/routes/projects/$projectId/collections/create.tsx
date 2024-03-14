import {
  CreateCollectionProps,
  ValueDefinition,
  createCollectionSchema,
  supportedIconSchema,
  uuid,
  valueDefinitionSchema,
} from '@elek-io/shared';
import {
  Button,
  FormInput,
  FormSelect,
  FormTextarea,
  FormToggle,
  Modal,
  NotificationIntent,
  PageSection,
} from '@elek-io/ui';
import { CheckIcon, PlusIcon } from '@heroicons/react/20/solid';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { ReactElement, useState } from 'react';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { Page } from '../../../../components/ui/page';

export const Route = createFileRoute('/projects/$projectId/collections/create')(
  {
    component: ProjectCollectionCreate,
  }
);

function ProjectCollectionCreate() {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = context.store((state) => state.addNotification);
  let [isAddValueDefinitionModalOpen, setIsAddValueDefinitionModalOpen] =
    useState(false);
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
          intent="primary"
          prependIcon={CheckIcon}
          onClick={createCollectionForm.handleSubmit(onCreate)}
        >
          Create Collection
        </Button>
      </>
    );
  }

  const onCreate: SubmitHandler<CreateCollectionProps> = async (
    createCollectionProps
  ) => {
    try {
      const collection = await context.core.collections.create({
        ...createCollectionProps,
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
      <Modal
        title="Add a new Value definition"
        description={`Choose what type the new Field of this Collection is going to be.`}
        isOpen={isAddValueDefinitionModalOpen}
        setIsOpen={setIsAddValueDefinitionModalOpen}
        actions={
          <Button
            intent="primary"
            onClick={valueDefinitionForm.handleSubmit((definition) =>
              onAddValueDefinition(definition)
            )}
          >
            Add Field definition
          </Button>
        }
        size="max-w-7xl"
      >
        <p>
          ToDo: Field type should be a grid with visual representation of the
          different types available
        </p>
        <FormSelect
          name={'valueType'}
          label="Type"
          control={valueDefinitionForm.control}
          errors={valueDefinitionForm.formState.errors}
          options={[
            { name: 'String', value: 'string' },
            { name: 'Number', value: 'number' },
            { name: 'Boolean', value: 'boolean' },
            { name: 'Asset', value: 'asset' },
            { name: 'List', value: 'list' },
            { name: 'Reference', value: 'reference' },
            { name: 'Slug', value: 'slug' },
          ]}
        ></FormSelect>
        <p>
          ToDo: From here on there should be an input field visible that is
          configured like the user specified. It should also scroll down and up
          with the user
        </p>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            <FormInput
              name={`id`}
              label="ID"
              description="Unique identifier of this definition"
              placeholder="UUID"
              type="text"
              register={valueDefinitionForm.register}
              errors={valueDefinitionForm.formState.errors}
            ></FormInput>
            <FormInput
              name={`name.${context.currentUser.locale.id}`}
              label="Name"
              description="The name of this Field"
              placeholder="Title"
              type="text"
              register={valueDefinitionForm.register}
              errors={valueDefinitionForm.formState.errors}
            ></FormInput>
            <FormTextarea
              name={`description.${context.currentUser.locale.id}`}
              label="Description"
              description="Describe what to input into this field. This text will be displayed under the field to guide users"
              placeholder=""
              rows={3}
              register={valueDefinitionForm.register}
              errors={valueDefinitionForm.formState.errors}
            ></FormTextarea>
            <hr className="p-2" />
            <FormToggle
              name={'isRequired'}
              label="Required"
              description="Required fields need to be filled before a CollectionItem can be created or updated"
              control={valueDefinitionForm.control}
              errors={valueDefinitionForm.formState.errors}
            ></FormToggle>
            <FormToggle
              name={'isUnique'}
              label="Unique"
              description="You won't be able to create an entry if there is an existing entry with identical content"
              control={valueDefinitionForm.control}
              errors={valueDefinitionForm.formState.errors}
            ></FormToggle>
            <FormSelect
              name={'inputWidth'}
              label="Field width"
              control={valueDefinitionForm.control}
              errors={valueDefinitionForm.formState.errors}
              options={[
                { name: '3/12', value: '3' },
                { name: '4/12', value: '4' },
                { name: '6/12', value: '6' },
                { name: '12/12', value: '12' },
              ]}
            ></FormSelect>
          </div>
          <div className="col-span-4">
            <div className="sticky top-6">
              <FormInput
                // @ts-ignore: This is just the example input
                name="example"
                label={
                  valueDefinitionForm.watch(
                    `name.${context.currentUser.locale.id}`
                  ) || 'Example'
                }
                description={valueDefinitionForm.watch(
                  `description.${context.currentUser.locale.id}`
                )}
                // @ts-ignore: This is just the example input
                type={valueDefinitionForm.watch('input.inputType')}
                register={valueDefinitionForm.register}
                errors={valueDefinitionForm.formState.errors}
              ></FormInput>
            </div>
          </div>
        </div>
      </Modal>
      {/* Content to create a new Collection.<br></br>
    Data: {JSON.stringify(watch())}
    <br></br>
    <br></br> */}
      <form className="divide-y divide-gray-200 lg:col-span-9">
        <section className="px-4 py-6 sm:p-6 lg:pb-8 flex-grow space-y-4">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 sm:col-span-8">
              <FormInput
                name={`name.singular.${context.currentUser.locale.id}`}
                type="text"
                label="Name (singular)"
                placeholder="Blogpost"
                description="Give your new Collection a name"
                register={createCollectionForm.register}
                errors={createCollectionForm.formState.errors}
                required
              ></FormInput>
              <FormInput
                name={`slug.singular`}
                type="text"
                label="Slug (singular)"
                placeholder="blogpost"
                description="The slug is used to generate the API routes"
                register={createCollectionForm.register}
                errors={createCollectionForm.formState.errors}
                required
              ></FormInput>
              <FormInput
                name={`name.plural.${context.currentUser.locale.id}`}
                type="text"
                label="Name (plural)"
                placeholder="Blogposts"
                description="Give your new Collection a name"
                register={createCollectionForm.register}
                errors={createCollectionForm.formState.errors}
                required
              ></FormInput>
              <FormInput
                name={`slug.plural`}
                type="text"
                label="Slug (plural)"
                placeholder="blogposts"
                description="Plural version of the slug"
                register={createCollectionForm.register}
                errors={createCollectionForm.formState.errors}
                required
              ></FormInput>
              <FormTextarea
                name={`description.${context.currentUser.locale.id}`}
                rows={3}
                label="Description"
                placeholder="Posts that are displayed inside the blog"
                description="Give your new Collection a description"
                register={createCollectionForm.register}
                errors={createCollectionForm.formState.errors}
              ></FormTextarea>
            </div>
            <div className="col-span-12 sm:col-span-4">
              <FormSelect
                name={`icon`}
                options={supportedIconSchema.options.map((option) => {
                  return {
                    name: option,
                    value: option,
                    disabled: false,
                  };
                })}
                label="Icon"
                description="The icon is used to quickly identify this Collection from others in the Client's UI"
                control={createCollectionForm.control}
                errors={createCollectionForm.formState.errors}
              ></FormSelect>
            </div>
          </div>
        </section>
        <PageSection
          title="Define this Collections Fields"
          description="Here you can define what the Collections content looks like. Add
              Field definitions to structure the Collections content and add
              input definitions to define how users interact with those
              Fields. For example you can create a Field `createdAt` of type
              `date` which atomatically restricts the input to only allow
              dates being inserted. Additionally this shows a datepicker UI to
              help users selecting a date."
          actions={
            <Button
              intent="primary"
              prependIcon={PlusIcon}
              onClick={() => setIsAddValueDefinitionModalOpen(true)}
            >
              Add Field definition
            </Button>
          }
        >
          <div className="grid grid-cols-12 gap-6 mt-6">
            {valueDefinitions.fields.map(
              (fieldDefinition, fieldDefinitionIndex) => {
                return (
                  <div
                    className={`col-span-12 sm:col-span-${fieldDefinition.inputWidth}`}
                  >
                    <div className="border rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm">
                      <h3 className="font-medium text-gray-700">
                        {fieldDefinition.name[context.currentUser.locale.id]} (
                        {fieldDefinition.inputType})
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
    </Page>
  );
}
