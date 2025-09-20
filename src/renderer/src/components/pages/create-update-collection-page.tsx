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
  FormFieldFromDefinition,
} from '../forms/util';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { TranslatableFormInput } from '../ui/form-input';
import { TranslatableFormTextarea } from '../ui/form-textarea';
import { Page, type PageProps } from '../ui/page';
import { PageSection } from '../ui/page-section';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';

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
      {/* {JSON.stringify(context.project.settings)}
      {JSON.stringify(collectionForm.watch())} */}
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
      <Form {...collectionForm}>
        <form onSubmit={collectionForm.handleSubmit(onCollectionSubmit)}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-12 gap-6 items-start">
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
                  onInteractOutside={(event) => {
                    console.log(event);
                    event.preventDefault();
                  }}
                  overlayChildren={
                    fieldDefinitionFormRef.current && (
                      <fieldDefinitionFormRef.current.getExampleFormField />
                    )
                  }
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

                  <SheetBody>
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
                      defaultLanguage={
                        context.project.settings.language.default
                      }
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
            <div className="grid grid-cols-12 gap-6 mt-6">
              {fieldDefinitions.fields.map((fieldDefinition, index) => {
                return (
                  <FormFieldFromDefinition
                    key={fieldDefinition.id}
                    fieldDefinition={fieldDefinition}
                    name={`currentFields.field-${index}.content`}
                    translateContent={context.translateContent}
                  />
                );
              })}
            </div>
            {/* <p>
              Dynamic Field generation. See
              https://react-hook-form.com/api/usefieldarray/
            </p>
            {JSON.stringify(collectionForm.watch())} */}
          </PageSection>
          {isUpdatingCollection(collectionFormProps) && (
            <PageSection title="Danger Zone">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium leading-6">
                    Delete this Collection
                  </p>
                </div>
                <div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash className="w-4 h-4 mr-2"></Trash>
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
                          <Trash className="w-4 h-4 mr-2"></Trash>
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
