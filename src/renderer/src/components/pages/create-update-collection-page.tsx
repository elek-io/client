import {
  CreateCollectionProps,
  DateFieldDefinition,
  DeleteCollectionProps,
  FieldDefinitionBase,
  FieldType,
  FieldTypeSchema,
  NumberFieldDefinition,
  Project,
  RangeFieldDefinition,
  TextFieldDefinition,
  TextareaFieldDefinition,
  ToggleFieldDefinition,
  TranslatableString,
  UpdateCollectionProps,
  dateFieldDefinitionSchema,
  numberFieldDefinitionSchema,
  rangeFieldDefinitionSchema,
  supportedIconSchema,
  textFieldDefinitionSchema,
  textareaFieldDefinitionSchema,
  toggleFieldDefinitionSchema,
  uuid,
} from '@elek-io/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash } from 'lucide-react';
import { useState } from 'react';
import {
  SubmitHandler,
  UseFormReturn,
  useFieldArray,
  useForm,
} from 'react-hook-form';
import { NumberFieldDefinitionForm } from '../forms/number-value-definition-form';
import { RangeFieldDefinitionForm } from '../forms/range-value-definition-form';
import { TextFieldDefinitionForm } from '../forms/text-value-definition-form';
import { TextareaFieldDefinitionForm } from '../forms/textarea-value-definition-form';
import { ToggleFieldDefinitionForm } from '../forms/toggle-value-definition-form';
import { FormFieldFromDefinition, translatableDefault } from '../forms/util';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
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
import { FormInput } from '../ui/form-input';
import { FormTextarea } from '../ui/form-textarea';
import { Page, PageProps } from '../ui/page';
import { PageSection } from '../ui/page-section';
import { ScrollArea } from '../ui/scroll-area';
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
    currentProject: Project;
    translate: (key: string, record: TranslatableString) => string;
  };
}

export const CreateUpdateCollectionPage = ({
  context,
  collectionForm,
  onCollectionSubmit,
  ...props
}: CreateUpdateCollectionPageProps): JSX.Element => {
  const [isAddFieldDefinitionSheetOpen, setIsAddFieldDefinitionSheetOpen] =
    useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState<FieldType>('text');
  const collectionFormProps = collectionForm.getValues();
  function isUpdatingCollection(
    collectionFormProps: CreateCollectionProps | UpdateCollectionProps
  ): collectionFormProps is UpdateCollectionProps {
    return (collectionFormProps as UpdateCollectionProps).id !== undefined;
  }

  const FieldDefinitionBaseDefaults: Omit<FieldDefinitionBase, 'id'> = {
    label: translatableDefault({
      supportedLanguages: context.currentProject.settings.language.supported,
    }),
    description: translatableDefault({
      supportedLanguages: context.currentProject.settings.language.supported,
    }),
    isRequired: true,
    isDisabled: false,
    isUnique: false,
    inputWidth: '12',
  };

  const textFieldDefinitionFormState = useForm<TextFieldDefinition>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      console.log(
        'TextFieldDefinition validation result',
        await zodResolver(textFieldDefinitionSchema)(data, context, options)
      );
      return zodResolver(textFieldDefinitionSchema)(data, context, options);
    },
    defaultValues: {
      ...FieldDefinitionBaseDefaults,
      id: uuid(),
      valueType: 'string',
      fieldType: 'text',
      defaultValue: null,
      min: null,
      max: 250,
    },
  });

  const textareaFieldDefinitionFormState = useForm<TextareaFieldDefinition>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      console.log(
        'TextareaFieldDefinition validation result',
        await zodResolver(textareaFieldDefinitionSchema)(data, context, options)
      );
      return zodResolver(textareaFieldDefinitionSchema)(data, context, options);
    },
    defaultValues: {
      ...FieldDefinitionBaseDefaults,
      id: uuid(),
      valueType: 'string',
      fieldType: 'textarea',
      defaultValue: null,
      min: null,
      max: null,
    },
  });

  const dateFieldDefinitionFormState = useForm<DateFieldDefinition>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      console.log(
        'DateFieldDefinition validation result',
        await zodResolver(dateFieldDefinitionSchema)(data, context, options)
      );
      return zodResolver(dateFieldDefinitionSchema)(data, context, options);
    },
    defaultValues: {
      ...FieldDefinitionBaseDefaults,
      id: uuid(),
      valueType: 'string',
      fieldType: 'date',
      defaultValue: null,
    },
  });

  const numberFieldDefinitionFormState = useForm<NumberFieldDefinition>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      console.log(
        'NumberFieldDefinition validation result',
        await zodResolver(numberFieldDefinitionSchema)(data, context, options)
      );
      return zodResolver(numberFieldDefinitionSchema)(data, context, options);
    },
    defaultValues: {
      ...FieldDefinitionBaseDefaults,
      id: uuid(),
      valueType: 'number',
      fieldType: 'number',
      defaultValue: null,
      min: null,
      max: null,
      isUnique: false,
    },
  });

  const rangeFieldDefinitionFormState = useForm<RangeFieldDefinition>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      console.log(
        'RangeFieldDefinition validation result',
        await zodResolver(rangeFieldDefinitionSchema)(data, context, options)
      );
      return zodResolver(rangeFieldDefinitionSchema)(data, context, options);
    },
    defaultValues: {
      ...FieldDefinitionBaseDefaults,
      id: uuid(),
      valueType: 'number',
      fieldType: 'range',
      defaultValue: 50,
      min: 0,
      max: 100,
      isRequired: true,
      isUnique: false,
    },
  });

  const toggleFieldDefinitionFormState = useForm<ToggleFieldDefinition>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      console.log(
        'ToggleFieldDefinition validation result',
        await zodResolver(toggleFieldDefinitionSchema)(data, context, options)
      );
      return zodResolver(toggleFieldDefinitionSchema)(data, context, options);
    },
    defaultValues: {
      ...FieldDefinitionBaseDefaults,
      id: uuid(),
      valueType: 'boolean',
      fieldType: 'toggle',
      defaultValue: false,
      isRequired: true,
      isUnique: false,
    },
  });

  const fieldDefinitions = useFieldArray({
    control: collectionForm.control, // control props comes from useForm (optional: if you are using FormContext)
    name: 'fieldDefinitions', // unique name for your Field Array
  });

  async function validateFieldDefinition(): Promise<void> {
    switch (selectedFieldType) {
      case 'text':
        return await textFieldDefinitionFormState.handleSubmit(
          (textDefinition) => {
            fieldDefinitions.append(textDefinition);
            setIsAddFieldDefinitionSheetOpen(false);
            textFieldDefinitionFormState.reset();
            textFieldDefinitionFormState.setValue('id', uuid());
          }
        )();
      case 'textarea':
        return await textareaFieldDefinitionFormState.handleSubmit(
          (textareaDefinition) => {
            fieldDefinitions.append(textareaDefinition);
            setIsAddFieldDefinitionSheetOpen(false);
            textareaFieldDefinitionFormState.reset();
            textareaFieldDefinitionFormState.setValue('id', uuid());
          }
        )();
      case 'number':
        return await numberFieldDefinitionFormState.handleSubmit(
          (numberDefinition) => {
            fieldDefinitions.append(numberDefinition);
            setIsAddFieldDefinitionSheetOpen(false);
            numberFieldDefinitionFormState.reset();
            numberFieldDefinitionFormState.setValue('id', uuid());
          }
        )();
      case 'range':
        return await rangeFieldDefinitionFormState.handleSubmit(
          (rangeDefinition) => {
            fieldDefinitions.append(rangeDefinition);
            setIsAddFieldDefinitionSheetOpen(false);
            rangeFieldDefinitionFormState.reset();
            rangeFieldDefinitionFormState.setValue('id', uuid());
          }
        )();
      case 'toggle':
        return await toggleFieldDefinitionFormState.handleSubmit(
          (toggleDefinition) => {
            fieldDefinitions.append(toggleDefinition);
            setIsAddFieldDefinitionSheetOpen(false);
            toggleFieldDefinitionFormState.reset();
            toggleFieldDefinitionFormState.setValue('id', uuid());
          }
        )();
      default:
        throw new Error(
          `Tried to validate unsupported fieldType "${selectedFieldType}" of Value definition`
        );
    }
  }

  const ExampleFormField = (): JSX.Element => {
    switch (selectedFieldType) {
      case 'number':
        return FormFieldFromDefinition<NumberFieldDefinition>(
          numberFieldDefinitionFormState.getValues(),
          // @ts-expect-error It's just an example
          'exampleFields.number.content',
          context.translate
        );
      case 'range':
        return FormFieldFromDefinition<RangeFieldDefinition>(
          rangeFieldDefinitionFormState.getValues(),
          // @ts-expect-error It's just an example
          'exampleFields.range.content',
          context.translate
        );
      case 'text':
        return FormFieldFromDefinition<TextFieldDefinition>(
          textFieldDefinitionFormState.getValues(),
          // @ts-expect-error It's just an example
          'exampleFields.text.content',
          context.translate
        );
      case 'textarea':
        return FormFieldFromDefinition<TextareaFieldDefinition>(
          textareaFieldDefinitionFormState.getValues(),
          // @ts-expect-error It's just an example
          'exampleFields.textarea.content',
          context.translate
        );
      case 'toggle':
        return FormFieldFromDefinition<ToggleFieldDefinition>(
          toggleFieldDefinitionFormState.getValues(),
          // @ts-expect-error It's just an example
          'exampleFields.toggle.content',
          context.translate
        );
      default:
        throw new Error(
          `Unsupported example form Field "${selectedFieldType}"`
        );
    }
  };

  const FieldDefinitionForm = (): JSX.Element => {
    switch (selectedFieldType) {
      case 'number':
        return (
          <NumberFieldDefinitionForm
            form={numberFieldDefinitionFormState}
            currentLanguage={context.currentProject.settings.language.default}
            supportedLanguages={
              context.currentProject.settings.language.supported
            }
            fieldType={selectedFieldType}
          />
        );
      case 'range':
        return (
          <RangeFieldDefinitionForm
            form={rangeFieldDefinitionFormState}
            currentLanguage={context.currentProject.settings.language.default}
            supportedLanguages={
              context.currentProject.settings.language.supported
            }
            fieldType={selectedFieldType}
          />
        );
      case 'text':
        return (
          <TextFieldDefinitionForm
            form={textFieldDefinitionFormState}
            currentLanguage={context.currentProject.settings.language.default}
            supportedLanguages={
              context.currentProject.settings.language.supported
            }
            fieldType={selectedFieldType}
          />
        );
      case 'textarea':
        return (
          <TextareaFieldDefinitionForm
            form={textareaFieldDefinitionFormState}
            currentLanguage={context.currentProject.settings.language.default}
            supportedLanguages={
              context.currentProject.settings.language.supported
            }
            fieldType={selectedFieldType}
          />
        );
      case 'toggle':
        return (
          <ToggleFieldDefinitionForm
            form={toggleFieldDefinitionFormState}
            currentLanguage={context.currentProject.settings.language.default}
            supportedLanguages={
              context.currentProject.settings.language.supported
            }
            fieldType={selectedFieldType}
          />
        );
      default:
        throw new Error(`Unsupported definition form "${selectedFieldType}"`);
    }
  };

  return (
    <Page {...props}>
      {JSON.stringify(context.currentProject.settings)}
      {JSON.stringify(collectionForm.watch())}
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
            <div className="grid grid-cols-12 gap-6">
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
                name={`name.plural.${context.currentProject.settings.language.default}`}
                render={({ field }) => (
                  <FormItem className="col-span-12 sm:col-span-5">
                    <FormLabel isRequired={true}>
                      Collection name (Plural)
                    </FormLabel>
                    <FormControl>
                      <Dialog>
                        <DialogTrigger asChild>
                          <FormInput field={field} type="text" />
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Collection name (Plural)</DialogTitle>
                            <DialogDescription>
                              The name of your new collection. Choose a short
                              name in plural that explains the content of the
                              collection - e.g. "Blogposts".
                            </DialogDescription>
                          </DialogHeader>

                          {context.currentProject.settings.language.supported.map(
                            (language) => {
                              return (
                                <FormField
                                  key={language}
                                  control={collectionForm.control}
                                  name={`name.plural.${language}`}
                                  render={({ field }) => (
                                    <FormItem className="col-span-12 sm:col-span-5">
                                      <FormLabel isRequired={true}>
                                        {language}
                                      </FormLabel>
                                      <FormControl>
                                        <FormInput field={field} type="text" />
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
                      The name of your new collection. Choose a short name in
                      plural that explains the content of the collection - e.g.
                      "Blogposts".
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={collectionForm.control}
                name={`name.singular.${context.currentProject.settings.language.default}`}
                render={({ field }) => (
                  <FormItem className="col-span-12 sm:col-span-5">
                    <FormLabel isRequired={true}>
                      Entry name (Singluar)
                    </FormLabel>
                    <FormControl>
                      <Dialog>
                        <DialogTrigger asChild>
                          <FormInput field={field} type="text" />
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Entry name (Singular)</DialogTitle>
                            <DialogDescription>
                              The name of each Entry inside your new Collection.
                              Choose a short name in singluar - e.g. "Blogpost".
                            </DialogDescription>
                          </DialogHeader>

                          {context.currentProject.settings.language.supported.map(
                            (language) => {
                              return (
                                <FormField
                                  key={language}
                                  control={collectionForm.control}
                                  name={`name.singular.${language}`}
                                  render={({ field }) => (
                                    <FormItem className="col-span-12 sm:col-span-5">
                                      <FormLabel isRequired={true}>
                                        {language}
                                      </FormLabel>
                                      <FormControl>
                                        <FormInput field={field} type="text" />
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
                      The name of each Entry inside your new Collection. Choose
                      a short name in singluar - e.g. "Blogpost".
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={collectionForm.control}
                name={`description.${context.currentProject.settings.language.default}`}
                render={({ field }) => (
                  <FormItem className="col-span-12 sm:col-span-12">
                    <FormLabel isRequired={true}>Description</FormLabel>
                    <FormControl>
                      <Dialog>
                        <DialogTrigger asChild>
                          <FormTextarea field={field} />
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Description</DialogTitle>
                            <DialogDescription>
                              A description of what this new Collection is used
                              for.
                            </DialogDescription>
                          </DialogHeader>

                          {context.currentProject.settings.language.supported.map(
                            (language) => {
                              return (
                                <FormField
                                  key={language}
                                  control={collectionForm.control}
                                  name={`description.${language}`}
                                  render={({ field }) => (
                                    <FormItem className="col-span-12 sm:col-span-5">
                                      <FormLabel isRequired={true}>
                                        {language}
                                      </FormLabel>
                                      <FormControl>
                                        <FormTextarea field={field} />
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
                open={isAddFieldDefinitionSheetOpen}
                onOpenChange={setIsAddFieldDefinitionSheetOpen}
              >
                <SheetTrigger asChild>
                  <Button
                    onClick={(event) => {
                      event.preventDefault();
                      setIsAddFieldDefinitionSheetOpen(true);
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
                  overlayChildren={<ExampleFormField></ExampleFormField>}
                >
                  <SheetHeader>
                    <SheetTitle>Add a Field to this Collection</SheetTitle>
                    <SheetDescription>
                      Adding Fields to your Collection will enable users to
                      enter data that follows the boundries you've set.
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
                    <ScrollArea>
                      <div className="p-6 space-y-6">
                        <FieldDefinitionForm></FieldDefinitionForm>
                      </div>
                    </ScrollArea>
                  </SheetBody>

                  <SheetFooter>
                    <Button
                      className="w-full"
                      onClick={validateFieldDefinition}
                    >
                      Add definition
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            }
          >
            <div className="grid grid-cols-12 gap-6 mt-6">
              {fieldDefinitions.fields.map((fieldDefinition, index) => {
                return FormFieldFromDefinition(
                  fieldDefinition,
                  `currentFields.field-${index}.content`,
                  context.translate
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
                            No, I've changed my mind
                          </Button>
                        </DialogClose>
                        <Button
                          variant="destructive"
                          onClick={() =>
                            props.onCollectionDelete &&
                            props.onCollectionDelete({
                              projectId: context.currentProject.id,
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
