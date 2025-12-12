import { Plus } from 'lucide-react';
import { type ReactElement, useRef, useState } from 'react';
import {
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
  useFieldArray,
} from 'react-hook-form';

import {
  DraggableComponent,
  SortableFieldArray,
} from '@renderer/components/drag-and-drop';
import {
  FieldDefinitionForm,
  type FieldDefinitionFormRef,
} from '@renderer/components/forms/util';
import { PageSection } from '@renderer/components/page-section';
import { Button } from '@renderer/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormFieldFromDefinition,
  FormItem,
  FormLabel,
  FormMessage,
  TranslatableFormInputField,
  TranslatableFormTextareaField,
} from '@renderer/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@renderer/components/ui/sheet';

import {
  type CreateCollectionProps,
  type FieldType,
  FieldTypeSchema,
  type Project,
  type UpdateCollectionProps,
  supportedIconSchema,
} from '@elek-io/core';

export interface CollectionFormProps<TFieldValues extends FieldValues> {
  collectionForm: UseFormReturn<TFieldValues>;
  project: Project;
  children?: React.ReactNode;
  isViewOnly?: boolean;
  onFormSubmit: SubmitHandler<TFieldValues>;
}

export const CollectionForm = ({
  collectionForm,
  project,
  children,
  isViewOnly = false,
  onFormSubmit,
}: CollectionFormProps<
  CreateCollectionProps | UpdateCollectionProps
>): ReactElement => {
  const fieldDefinitionFormRef = useRef<FieldDefinitionFormRef>(null);
  const [isAddFieldDefinitionSheetOpen, setIsAddFieldDefinitionSheetOpen] =
    useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState<FieldType>('text');

  const fieldDefinitions = useFieldArray({
    control: collectionForm.control, // control props comes from useForm (optional: if you are using FormContext)
    name: 'fieldDefinitions', // unique name for your Field Array
  });

  async function addFieldDefinition(): Promise<void> {
    if (fieldDefinitionFormRef.current) {
      await fieldDefinitionFormRef.current.addDefinition();
    }
  }

  return (
    <Form {...collectionForm}>
      <form onSubmit={collectionForm.handleSubmit(onFormSubmit)}>
        <fieldset disabled={isViewOnly}>
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-12 items-start gap-6">
              <FormField
                control={collectionForm.control}
                name="icon"
                render={({ field }) => (
                  <FormItem className="col-span-12 sm:col-span-2">
                    <FormLabel isRequired>Icon</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
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
                control={collectionForm.control}
                name={`name.plural.${project.settings.language.default}`}
                render={({ field }) => (
                  <FormItem className="col-span-12 sm:col-span-5">
                    <FormLabel isRequired>Collection name (Plural)</FormLabel>
                    <FormControl>
                      <TranslatableFormInputField
                        title="Collection name (Plural)"
                        description='The name of your new collection. Choose a short name in plural that explains the content of the collection - e.g. "Blogposts".'
                        type="text"
                        field={field}
                        errors={collectionForm.formState.errors}
                        supportedLanguages={project.settings.language.supported}
                      />
                    </FormControl>
                    <FormDescription>
                      The name of your new collection. Choose a short name in
                      plural that explains the content of the collection - e.g.
                      &quot;Blogposts&quot;.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={collectionForm.control}
                name={`name.singular.${project.settings.language.default}`}
                render={({ field }) => (
                  <FormItem className="col-span-12 sm:col-span-5">
                    <FormLabel isRequired>Entry name (Singluar)</FormLabel>
                    <FormControl>
                      <TranslatableFormInputField
                        title="Entry name (Singluar)"
                        description='The name of each Entry inside your new Collection. Choose a short name in singluar - e.g. "Blogpost".'
                        type="text"
                        field={field}
                        errors={collectionForm.formState.errors}
                        supportedLanguages={project.settings.language.supported}
                      />
                    </FormControl>
                    <FormDescription>
                      The name of each Entry inside your new Collection. Choose
                      a short name in singluar - e.g. &quot;Blogpost&quot;.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={collectionForm.control}
                name={`description.${project.settings.language.default}`}
                render={({ field }) => (
                  <FormItem className="col-span-12 sm:col-span-12">
                    <FormLabel isRequired>Description</FormLabel>
                    <FormControl>
                      <TranslatableFormTextareaField
                        title="Description"
                        description="A description of what this new Collection is used for."
                        field={field}
                        errors={collectionForm.formState.errors}
                        supportedLanguages={project.settings.language.supported}
                      />
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
              control={collectionForm.control}
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
              control={collectionForm.control}
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
            title="Define this Collections Fields"
            description="Add Fields to structure the Collections content and define how users interact with those Fields."
            actions={
              isViewOnly ? (
                <></>
              ) : (
                <Sheet
                  open={isAddFieldDefinitionSheetOpen}
                  onOpenChange={setIsAddFieldDefinitionSheetOpen}
                >
                  <SheetTrigger asChild>
                    <Button
                      Icon={Plus}
                      onClick={(event) => {
                        event.preventDefault();
                        setIsAddFieldDefinitionSheetOpen(true);
                      }}
                    >
                      Add Field
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                  // @todo Uncomment to not close the Sheet when clicking into the example inputs - this needs some work, since then it's also not possible to use the example input
                  //
                  // onInteractOutside={(event) => {
                  //   console.log(event);
                  //   event.preventDefault();
                  // }}
                  // overlayChildren={
                  //   fieldDefinitionFormRef.current && (
                  //     <fieldDefinitionFormRef.current.getExampleFormField
                  //       fieldType={selectedFieldType}
                  //     />
                  //   )
                  // }
                  >
                    <SheetHeader>
                      <SheetTitle>Add a Field to this Collection</SheetTitle>
                      <SheetDescription>
                        Adding Fields to your Collection will enable users to
                        enter data that follows the boundries you&apos;ve set.
                      </SheetDescription>
                      <FormItem>
                        <FormLabel isRequired>Input type</FormLabel>
                        <Select
                          value={selectedFieldType}
                          onValueChange={(value: FieldType) =>
                            setSelectedFieldType(value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FieldTypeSchema.options.map((option) => {
                              return (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The type of input the user is able to enter for this
                          Field.
                        </FormDescription>
                      </FormItem>
                    </SheetHeader>

                    <SheetBody>
                      <FieldDefinitionForm
                        ref={fieldDefinitionFormRef}
                        fieldDefinitions={fieldDefinitions}
                        setIsAddFieldDefinitionSheetOpen={
                          setIsAddFieldDefinitionSheetOpen
                        }
                        fieldType={selectedFieldType}
                        supportedLanguages={project.settings.language.supported}
                        defaultLanguage={project.settings.language.default}
                      />
                    </SheetBody>

                    <SheetFooter>
                      <Button className="w-full" onClick={addFieldDefinition}>
                        Add definition
                      </Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              )
            }
          >
            <div className="mt-6 grid grid-cols-12 gap-6">
              <SortableFieldArray fieldArray={fieldDefinitions}>
                {fieldDefinitions.fields.map((fieldDefinition, index) => {
                  return (
                    <DraggableComponent
                      key={fieldDefinition.id}
                      id={fieldDefinition.id}
                    >
                      <FormFieldFromDefinition
                        fieldDefinition={fieldDefinition}
                        form={collectionForm}
                        // @ts-ignore This is only to display the field, not to actually edit anything but the order of the fields
                        name={`currentFields.field-${index}.content`}
                        supportedLanguages={project.settings.language.supported}
                        isDraggable={isViewOnly === false}
                        isEditable={isViewOnly === false}
                        onDelete={
                          isViewOnly
                            ? undefined
                            : (fieldDefinition) => {
                                const index = fieldDefinitions.fields.findIndex(
                                  (field) => field.id === fieldDefinition.id
                                );
                                fieldDefinitions.remove(index);
                              }
                        }
                      />
                    </DraggableComponent>
                  );
                })}
              </SortableFieldArray>
            </div>
          </PageSection>
          {children}
        </fieldset>
      </form>
    </Form>
  );
};
