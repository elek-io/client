import { Plus, Trash } from 'lucide-react';
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
import { TranslatableFormInput } from '@renderer/components/form-input';
import { TranslatableFormTextarea } from '@renderer/components/form-textarea';
import {
  FieldDefinitionForm,
  type FieldDefinitionFormRef,
} from '@renderer/components/forms/util';
import { Page, type PageProps } from '@renderer/components/page';
import { PageSection } from '@renderer/components/page-section';
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormFieldFromDefinition,
  FormItem,
  FormLabel,
  FormMessage,
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
  type DeleteCollectionProps,
  type FieldType,
  FieldTypeSchema,
  type SupportedLanguage,
  type TranslatableString,
  type UpdateCollectionProps,
  supportedIconSchema,
} from '@elek-io/core';

export interface CreateUpdateCollectionPageProps<
  TFieldValues extends FieldValues,
> extends PageProps {
  collectionForm: UseFormReturn<TFieldValues>;
  supportedLanguages: SupportedLanguage[];
  defaultLanguage: SupportedLanguage;
  translateContent(key: string, record: TranslatableString): string;
  onFormSubmit: SubmitHandler<TFieldValues>;
  onCollectionDelete?: SubmitHandler<DeleteCollectionProps>;
}

export const CreateUpdateCollectionPage = ({
  collectionForm,
  supportedLanguages,
  defaultLanguage,
  translateContent,
  onFormSubmit,
  onCollectionDelete,
  ...props
}: CreateUpdateCollectionPageProps<
  CreateCollectionProps | UpdateCollectionProps
>): ReactElement => {
  const fieldDefinitionFormRef = useRef<FieldDefinitionFormRef>(null);
  const [isAddFieldDefinitionSheetOpen, setIsAddFieldDefinitionSheetOpen] =
    useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState<FieldType>('text');
  const collectionFormProps = collectionForm.getValues();

  /**
   * Type Guard to check if we are in "update" mode
   */
  function isUpdatingCollection(
    collectionFormProps: CreateCollectionProps | UpdateCollectionProps
  ): collectionFormProps is UpdateCollectionProps {
    return 'id' in collectionFormProps;
  }

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
    <Page {...props}>
      <Form {...collectionForm}>
        <form onSubmit={collectionForm.handleSubmit(onFormSubmit)}>
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
                name={`name.plural.${defaultLanguage}`}
                render={({ field }) => (
                  <FormItem className="col-span-12 sm:col-span-5">
                    <FormLabel isRequired>Collection name (Plural)</FormLabel>
                    <FormControl>
                      <TranslatableFormInput
                        title="Collection name (Plural)"
                        description='The name of your new collection. Choose a short name in plural that explains the content of the collection - e.g. "Blogposts".'
                        type="text"
                        field={field}
                        errors={collectionForm.formState.errors}
                        supportedLanguages={supportedLanguages}
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
                name={`name.singular.${defaultLanguage}`}
                render={({ field }) => (
                  <FormItem className="col-span-12 sm:col-span-5">
                    <FormLabel isRequired>Entry name (Singluar)</FormLabel>
                    <FormControl>
                      <TranslatableFormInput
                        title="Entry name (Singluar)"
                        description='The name of each Entry inside your new Collection. Choose a short name in singluar - e.g. "Blogpost".'
                        type="text"
                        field={field}
                        errors={collectionForm.formState.errors}
                        supportedLanguages={supportedLanguages}
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
                name={`description.${defaultLanguage}`}
                render={({ field }) => (
                  <FormItem className="col-span-12 sm:col-span-12">
                    <FormLabel isRequired>Description</FormLabel>
                    <FormControl>
                      <TranslatableFormTextarea
                        title="Description"
                        description="A description of what this new Collection is used for."
                        field={field}
                        errors={collectionForm.formState.errors}
                        supportedLanguages={supportedLanguages}
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
                      translateContent={translateContent}
                      setIsAddFieldDefinitionSheetOpen={
                        setIsAddFieldDefinitionSheetOpen
                      }
                      fieldType={selectedFieldType}
                      supportedLanguages={supportedLanguages}
                      defaultLanguage={defaultLanguage}
                    />
                  </SheetBody>

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
                        supportedLanguages={supportedLanguages}
                        translateContent={translateContent}
                        isDraggable
                        isEditable
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
          {isUpdatingCollection(collectionFormProps) && onCollectionDelete ? (
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
                        <Trash className="mr-2 h-4 w-4" />
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
                            onCollectionDelete({
                              projectId: collectionFormProps.projectId,
                              id: collectionFormProps.id,
                            })
                          }
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Yes, delete this Collection
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </PageSection>
          ) : null}
        </form>
      </Form>
    </Page>
  );
};

CreateUpdateCollectionPage.displayName = 'CreateUpdateCollectionPage';
