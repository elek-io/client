import { fieldWidth } from '@/util';
import {
  CreateCollectionProps,
  DateValueDefinition,
  DeleteCollectionProps,
  NumberValueDefinition,
  Project,
  RangeValueDefinition,
  TextValueDefinition,
  TextareaValueDefinition,
  ToggleValueDefinition,
  TranslatableString,
  UpdateCollectionProps,
  ValueDefinitionBase,
  ValueInputType,
  ValueInputTypeSchema,
  dateValueDefinitionSchema,
  numberValueDefinitionSchema,
  rangeValueDefinitionSchema,
  supportedIconSchema,
  textValueDefinitionSchema,
  textareaValueDefinitionSchema,
  toggleValueDefinitionSchema,
  uuid,
} from '@elek-io/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash } from 'lucide-react';
import React, { useState } from 'react';
import {
  SubmitHandler,
  UseFormReturn,
  useFieldArray,
  useForm,
} from 'react-hook-form';
import {
  NumberValueDefinitionForm,
  NumberValueDefinitionFormFieldExample,
} from '../forms/number-value-definition-form';
import {
  RangeValueDefinitionForm,
  RangeValueDefinitionFormFieldExample,
} from '../forms/range-value-definition-form';
import {
  TextValueDefinitionForm,
  TextValueDefinitionFormExample,
} from '../forms/text-value-definition-form';
import {
  TextareaValueDefinitionForm,
  TextareaValueDefinitionFormExample,
} from '../forms/textarea-value-definition-form';
import {
  ToggleValueDefinitionForm,
  ToggleValueDefinitionFormExample,
} from '../forms/toggle-value-definition-form';
import { ValueInputFromDefinition, translatableDefault } from '../forms/util';
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
import { Input } from '../ui/input';
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
import { Textarea } from '../ui/textarea';

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

export const CreateUpdateCollectionPage = React.forwardRef<
  HTMLElement,
  CreateUpdateCollectionPageProps
>(
  (
    { className, context, collectionForm, onCollectionSubmit, ...props },
    ref
  ) => {
    const [isAddValueDefinitionSheetOpen, setIsAddValueDefinitionSheetOpen] =
      useState(false);
    const [selectedInputType, setSelectedInputType] =
      useState<ValueInputType>('text');

    const valueDefinitionBaseDefaults: Omit<ValueDefinitionBase, 'id'> = {
      label: translatableDefault({
        supportedLanguages: context.currentProject.settings.language.supported,
        default: '',
      }),
      description: translatableDefault({
        supportedLanguages: context.currentProject.settings.language.supported,
        default: '',
      }),
      isRequired: true,
      isDisabled: false,
      inputWidth: '12',
    };

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
        ...valueDefinitionBaseDefaults,
        id: uuid(),
        valueType: 'string',
        inputType: 'text',
        defaultValue: undefined,
        min: undefined,
        max: 250,
        isUnique: false,
      },
    });

    const textareaValueDefinitionFormState = useForm<TextareaValueDefinition>({
      resolver: async (data, context, options) => {
        // you can debug your validation schema here
        console.log(
          'TextareaValueDefinition validation result',
          await zodResolver(textareaValueDefinitionSchema)(
            data,
            context,
            options
          )
        );
        return zodResolver(textareaValueDefinitionSchema)(
          data,
          context,
          options
        );
      },
      defaultValues: {
        ...valueDefinitionBaseDefaults,
        id: uuid(),
        valueType: 'string',
        inputType: 'textarea',
        defaultValue: undefined,
        min: undefined,
        max: undefined,
        isUnique: false,
      },
    });

    const dateValueDefinitionFormState = useForm<DateValueDefinition>({
      resolver: async (data, context, options) => {
        // you can debug your validation schema here
        console.log(
          'DateValueDefinition validation result',
          await zodResolver(dateValueDefinitionSchema)(data, context, options)
        );
        return zodResolver(dateValueDefinitionSchema)(data, context, options);
      },
      defaultValues: {
        ...valueDefinitionBaseDefaults,
        id: uuid(),
        valueType: 'string',
        inputType: 'date',
        defaultValue: undefined,
        isUnique: false,
      },
    });

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
      },
    });

    const rangeValueDefinitionFormState = useForm<RangeValueDefinition>({
      resolver: async (data, context, options) => {
        // you can debug your validation schema here
        console.log(
          'RangeValueDefinition validation result',
          await zodResolver(rangeValueDefinitionSchema)(data, context, options)
        );
        return zodResolver(rangeValueDefinitionSchema)(data, context, options);
      },
      defaultValues: {
        ...valueDefinitionBaseDefaults,
        id: uuid(),
        valueType: 'number',
        inputType: 'range',
        defaultValue: 50,
        min: 0,
        max: 100,
        isUnique: false,
      },
    });

    const toggleValueDefinitionFormState = useForm<ToggleValueDefinition>({
      resolver: async (data, context, options) => {
        // you can debug your validation schema here
        console.log(
          'ToggleValueDefinition validation result',
          await zodResolver(toggleValueDefinitionSchema)(data, context, options)
        );
        return zodResolver(toggleValueDefinitionSchema)(data, context, options);
      },
      defaultValues: {
        ...valueDefinitionBaseDefaults,
        id: uuid(),
        valueType: 'boolean',
        inputType: 'toggle',
        defaultValue: false,
      },
    });

    const valueDefinitions = useFieldArray({
      control: collectionForm.control, // control props comes from useForm (optional: if you are using FormContext)
      name: 'valueDefinitions', // unique name for your Field Array
    });

    async function validateValueDefinition() {
      switch (selectedInputType) {
        case 'text':
          return await textValueDefinitionFormState.handleSubmit(
            (textDefinition) => {
              valueDefinitions.append(textDefinition);
              setIsAddValueDefinitionSheetOpen(false);
              textValueDefinitionFormState.reset();
              textValueDefinitionFormState.setValue('id', uuid());
            }
          )();
        case 'textarea':
          return await textareaValueDefinitionFormState.handleSubmit(
            (textareaDefinition) => {
              valueDefinitions.append(textareaDefinition);
              setIsAddValueDefinitionSheetOpen(false);
              textareaValueDefinitionFormState.reset();
              textareaValueDefinitionFormState.setValue('id', uuid());
            }
          )();
        case 'number':
          return await numberValueDefinitionFormState.handleSubmit(
            (numberDefinition) => {
              valueDefinitions.append(numberDefinition);
              setIsAddValueDefinitionSheetOpen(false);
              numberValueDefinitionFormState.reset();
              numberValueDefinitionFormState.setValue('id', uuid());
            }
          )();
        case 'range':
          return await rangeValueDefinitionFormState.handleSubmit(
            (rangeDefinition) => {
              valueDefinitions.append(rangeDefinition);
              setIsAddValueDefinitionSheetOpen(false);
              rangeValueDefinitionFormState.reset();
              rangeValueDefinitionFormState.setValue('id', uuid());
            }
          )();
        case 'toggle':
          return await toggleValueDefinitionFormState.handleSubmit(
            (toggleDefinition) => {
              valueDefinitions.append(toggleDefinition);
              setIsAddValueDefinitionSheetOpen(false);
              toggleValueDefinitionFormState.reset();
              toggleValueDefinitionFormState.setValue('id', uuid());
            }
          )();
        default:
          throw new Error(
            `Tried to validate unsupported inputType "${selectedInputType}" of Value definition`
          );
      }
    }

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
                            <Input {...field} />
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Collection name (Plural)
                              </DialogTitle>
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
                                          <Input {...field} />
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
                        plural that explains the content of the collection -
                        e.g. "Blogposts".
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
                            <Input {...field} />
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Entry name (Singular)</DialogTitle>
                              <DialogDescription>
                                The name of each Entry inside your new
                                Collection. Choose a short name in singluar -
                                e.g. "Blogpost".
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
                                          <Input {...field} />
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
                        The name of each Entry inside your new Collection.
                        Choose a short name in singluar - e.g. "Blogpost".
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
                            <Textarea {...field} />
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Description</DialogTitle>
                              <DialogDescription>
                                A description of what this new Collection is
                                used for.
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
                                          <Textarea {...field} />
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
                      (selectedInputType === 'number' && (
                        <NumberValueDefinitionFormFieldExample
                          state={numberValueDefinitionFormState}
                          currentLanguage={
                            context.currentProject.settings.language.default
                          }
                        />
                      )) ||
                      (selectedInputType === 'range' && (
                        <RangeValueDefinitionFormFieldExample
                          state={rangeValueDefinitionFormState}
                          currentLanguage={
                            context.currentProject.settings.language.default
                          }
                        />
                      )) ||
                      (selectedInputType === 'text' && (
                        <TextValueDefinitionFormExample
                          state={textValueDefinitionFormState}
                          currentLanguage={
                            context.currentProject.settings.language.default
                          }
                        />
                      )) ||
                      (selectedInputType === 'textarea' && (
                        <TextareaValueDefinitionFormExample
                          state={textareaValueDefinitionFormState}
                          currentLanguage={
                            context.currentProject.settings.language.default
                          }
                        />
                      )) ||
                      (selectedInputType === 'toggle' && (
                        <ToggleValueDefinitionFormExample
                          state={toggleValueDefinitionFormState}
                          currentLanguage={
                            context.currentProject.settings.language.default
                          }
                        />
                      ))
                    }
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
                          {(selectedInputType === 'number' && (
                            <NumberValueDefinitionForm
                              state={numberValueDefinitionFormState}
                              currentLanguage={
                                context.currentProject.settings.language.default
                              }
                              supportedLanguages={
                                context.currentProject.settings.language
                                  .supported
                              }
                            />
                          )) ||
                            (selectedInputType === 'range' && (
                              <RangeValueDefinitionForm
                                state={rangeValueDefinitionFormState}
                                currentLanguage={
                                  context.currentProject.settings.language
                                    .default
                                }
                                supportedLanguages={
                                  context.currentProject.settings.language
                                    .supported
                                }
                              />
                            )) ||
                            (selectedInputType === 'text' && (
                              <TextValueDefinitionForm
                                state={textValueDefinitionFormState}
                                currentLanguage={
                                  context.currentProject.settings.language
                                    .default
                                }
                                supportedLanguages={
                                  context.currentProject.settings.language
                                    .supported
                                }
                              />
                            )) ||
                            (selectedInputType === 'textarea' && (
                              <TextareaValueDefinitionForm
                                state={textareaValueDefinitionFormState}
                                currentLanguage={
                                  context.currentProject.settings.language
                                    .default
                                }
                                supportedLanguages={
                                  context.currentProject.settings.language
                                    .supported
                                }
                              />
                            )) ||
                            (selectedInputType === 'toggle' && (
                              <ToggleValueDefinitionForm
                                state={toggleValueDefinitionFormState}
                                currentLanguage={
                                  context.currentProject.settings.language
                                    .default
                                }
                                supportedLanguages={
                                  context.currentProject.settings.language
                                    .supported
                                }
                              />
                            ))}
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
                          <FormLabel
                            isRequired={
                              'isRequired' in definition
                                ? definition.isRequired
                                : false
                            }
                          >
                            {context.translate(
                              'definition.label',
                              definition.label
                            )}
                          </FormLabel>
                          <FormControl>
                            {/* @todo add styling for toggle switches */}
                            {ValueInputFromDefinition<CreateCollectionProps>(
                              definition,
                              collectionForm,
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
            {JSON.stringify(collectionForm.watch())} */}
            </PageSection>
            {'onCollectionDelete' in props &&
              'id' in collectionForm.getValues() && (
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
                                props.onCollectionDelete({
                                  projectId: context.currentProject.id,
                                  id: collectionForm.getValues().id,
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
  }
);
