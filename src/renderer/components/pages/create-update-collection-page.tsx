import { Plus, Trash } from 'lucide-react';
import { type ReactElement, useRef, useState } from 'react';
import {
  type SubmitHandler,
  type UseFormReturn,
  useFieldArray,
} from 'react-hook-form';

import {
  FieldDefinitionForm,
  type FieldDefinitionFormRef,
} from '@renderer/components/forms/util';
import { Button } from '@renderer/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@renderer/components/ui/dialog';
import {
  DraggableComponent,
  SortableFieldArray,
} from '@renderer/components/ui/drag-and-drop';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormFieldFromDefinition,
  FormItem,
  FormLabel,
  FormMessage,
} from '@renderer/components/ui/form';
import { TranslatableFormInput } from '@renderer/components/ui/form-input';
import { TranslatableFormTextarea } from '@renderer/components/ui/form-textarea';
import { Page, type PageProps } from '@renderer/components/ui/page';
import { PageSection } from '@renderer/components/ui/page-section';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select';
import {
  Sheet,
  // SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@renderer/components/ui/sheet';

import {
  type CreateCollectionProps,
  type DeleteCollectionProps,
  type FieldType,
  FieldTypeSchema,
  type Project,
  type TranslatableString,
  type UpdateCollectionProps,
  supportedIconSchema,
} from '@elek-io/core';

export interface CreateUpdateCollectionPageProps extends PageProps {
  collectionForm: UseFormReturn<CreateCollectionProps | UpdateCollectionProps>;
  onCollectionSubmit: SubmitHandler<
    CreateCollectionProps | UpdateCollectionProps
  >;
  onCollectionDelete?: SubmitHandler<DeleteCollectionProps>;
  context: {
    project: Project;
    translateContent: (key: string, record: TranslatableString) => string;
  };
}

export const CreateUpdateCollectionPage = ({
  context,
  collectionForm,
  onCollectionSubmit,
  ...props
}: CreateUpdateCollectionPageProps): ReactElement => {
  const fieldDefinitionFormRef = useRef<FieldDefinitionFormRef>(null);
  const [isAddFieldDefinitionSheetOpen, setIsAddFieldDefinitionSheetOpen] =
    useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState<FieldType>('text');
  const collectionFormProps = collectionForm.getValues();
  function isUpdatingCollection(
    collectionFormProps: CreateCollectionProps | UpdateCollectionProps
  ): collectionFormProps is UpdateCollectionProps {
    return (collectionFormProps as UpdateCollectionProps).id !== undefined;
  }

  const fieldDefinitions = useFieldArray({
    control: collectionForm.control, // control props comes from useForm (optional: if you are using FormContext)
    name: 'fieldDefinitions', // unique name for your Field Array
  });

  async function addFieldDefinition(): Promise<void> {
    fieldDefinitionFormRef.current &&
      fieldDefinitionFormRef.current.addDefinition();
  }

  return (
    <Page {...props}>
      <Form {...collectionForm}>
        <form onSubmit={collectionForm.handleSubmit(onCollectionSubmit)}>
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-12 items-start gap-6">
              <FormField
                control={collectionForm.control}
                name={`icon`}
                render={({ field }) => (
                  <FormItem className="col-span-12 sm:col-span-2">
                    <FormLabel isRequired={true}>Icon</FormLabel>
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
                name={`name.plural.${context.project.settings.language.default}`}
                render={({ field }) => (
                  <FormItem className="col-span-12 sm:col-span-5">
                    <FormLabel isRequired={true}>
                      Collection name (Plural)
                    </FormLabel>
                    <FormControl>
                      <TranslatableFormInput
                        title="Collection name (Plural)"
                        description='The name of your new collection. Choose a short name in plural that explains the content of the collection - e.g. "Blogposts".'
                        type="text"
                        field={field}
                        errors={collectionForm.formState.errors}
                        supportedLanguages={
                          context.project.settings.language.supported
                        }
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
                name={`name.singular.${context.project.settings.language.default}`}
                render={({ field }) => (
                  <FormItem className="col-span-12 sm:col-span-5">
                    <FormLabel isRequired={true}>
                      Entry name (Singluar)
                    </FormLabel>
                    <FormControl>
                      <TranslatableFormInput
                        title="Entry name (Singluar)"
                        description='The name of each Entry inside your new Collection. Choose a short name in singluar - e.g. "Blogpost".'
                        type="text"
                        field={field}
                        errors={collectionForm.formState.errors}
                        supportedLanguages={
                          context.project.settings.language.supported
                        }
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
                name={`description.${context.project.settings.language.default}`}
                render={({ field }) => (
                  <FormItem className="col-span-12 sm:col-span-12">
                    <FormLabel isRequired={true}>Description</FormLabel>
                    <FormControl>
                      <TranslatableFormTextarea
                        title="Description"
                        description="A description of what this new Collection is used for."
                        field={field}
                        errors={collectionForm.formState.errors}
                        supportedLanguages={
                          context.project.settings.language.supported
                        }
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
                      <FormLabel isRequired={true}>Input type</FormLabel>
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

                  {/* <SheetBody> */}
                  <FieldDefinitionForm
                    ref={fieldDefinitionFormRef}
                    fieldDefinitions={fieldDefinitions}
                    translateContent={context.translateContent}
                    setIsAddFieldDefinitionSheetOpen={
                      setIsAddFieldDefinitionSheetOpen
                    }
                    fieldType={selectedFieldType}
                    supportedLanguages={
                      context.project.settings.language.supported
                    }
                    defaultLanguage={context.project.settings.language.default}
                  />
                  {/* </SheetBody> */}

                  <SheetFooter>
                    <Button className="w-full" onClick={addFieldDefinition}>
                      Add definition
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
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
                        supportedLanguages={
                          context.project.settings.language.supported
                        }
                        translateContent={context.translateContent}
                        isDraggable={true}
                        isEditable={true}
                        onDelete={(fieldDefinition) => {
                          const index = fieldDefinitions.fields.findIndex(
                            (field) => field.id === fieldDefinition.id
                          );
                          fieldDefinitions.remove(index);
                        }}
                      />
                    </DraggableComponent>
                  );
                })}
              </SortableFieldArray>
            </div>
          </PageSection>
          {isUpdatingCollection(collectionFormProps) && (
            <PageSection title="Danger Zone">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm leading-6 font-medium">
                    Delete this Collection
                  </p>
                </div>
                <div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash className="mr-2 h-4 w-4"></Trash>
                        Delete Collection
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="secondary">
                            No, I&apos;ve changed my mind
                          </Button>
                        </DialogClose>
                        <Button
                          variant="destructive"
                          onClick={() =>
                            props.onCollectionDelete &&
                            props.onCollectionDelete({
                              projectId: context.project.id,
                              id: collectionFormProps.id,
                            })
                          }
                        >
                          <Trash className="mr-2 h-4 w-4"></Trash>
                          Yes, delete this Collection
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </PageSection>
          )}
        </form>
      </Form>
    </Page>
  );
};

CreateUpdateCollectionPage.displayName = 'CreateUpdateCollectionPage';
