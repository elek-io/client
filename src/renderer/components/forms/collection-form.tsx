import { Plus } from 'lucide-react';
import { type ReactElement, useRef, useState } from 'react';
import {
  type Control,
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
  FieldGroup,
  FieldLegend,
  FieldSet,
} from '@renderer/components/ui/field';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormFieldFromDefinition,
  FormInputField,
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
import { useProject } from '@renderer/hooks/useProject';

import {
  type FieldDefinitionOrGroup,
  type FieldType,
  fieldTypeSchema,
  type Project,
  type UpdateCollectionProps,
  supportedIconSchema,
} from '@elek-io/core';

// Field types Core defines but the desktop app has no definition form for yet. They are
// shown disabled in the picker so selecting one cannot crash the sheet.
// See contributing/not-yet-implemented.md.
const unimplementedFieldTypes: ReadonlySet<FieldType> = new Set(['dynamic']);

export interface CollectionFormProps<
  TFieldValues extends FieldValues,
  TTransformedValues extends FieldValues,
> {
  collectionForm: UseFormReturn<TFieldValues, unknown, TTransformedValues>;
  project: Project;
  children?: React.ReactNode;
  isViewOnly?: boolean;
  onFormSubmit: SubmitHandler<TTransformedValues>;
  /**
   * Associates the form with a submit button rendered outside it (in the page
   * header via `Page`'s `actions`). That button carries `type="submit"` and the
   * same `form={id}`, so it submits this form from outside its subtree.
   */
  id?: string;
}

export function CollectionForm<
  TFieldValues extends FieldValues,
  TTransformedValues extends FieldValues,
>({
  collectionForm: genericForm,
  project,
  children,
  isViewOnly = false,
  onFormSubmit,
  id,
}: CollectionFormProps<TFieldValues, TTransformedValues>): ReactElement {
  const { translateContent } = useProject();
  // The many concrete collection fields (icon, name, description) use literal paths
  // RHF cannot resolve for a generic T, so view the form as the collection props for
  // those. The generic keeps the callers (create, update, diff) type-safe.
  const collectionForm =
    genericForm as unknown as UseFormReturn<UpdateCollectionProps>;
  const fieldDefinitionFormRef = useRef<FieldDefinitionFormRef>(null);
  const [isAddFieldDefinitionSheetOpen, setIsAddFieldDefinitionSheetOpen] =
    useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState<FieldType>('text');

  // Opaque id-rows so useFieldArray never walks the deep FieldDefinitionOrGroup
  // union (RHF instantiation depth limit). Rows are recovered when rendering.
  const fieldDefinitions = useFieldArray({
    control: genericForm.control as unknown as Control<{
      fieldDefinitions: { id: string }[];
    }>,
    name: 'fieldDefinitions',
  });

  async function addFieldDefinition(): Promise<void> {
    if (fieldDefinitionFormRef.current) {
      await fieldDefinitionFormRef.current.addDefinition();
    }
  }

  return (
    <Form {...genericForm}>
      {/* noValidate: zod (through RHF) owns validation. Without it the browser's
      native constraint check on required inputs, including the field-definition
      preview inputs, blocks submit before handleSubmit runs. */}
      <form
        id={id}
        noValidate
        onSubmit={genericForm.handleSubmit(onFormSubmit)}
      >
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
                    <FormLabel isRequired>Entry name (Singular)</FormLabel>
                    <FormControl>
                      <TranslatableFormInputField
                        title="Entry name (Singular)"
                        description='The name of each Entry inside your new Collection. Choose a short name in singular - e.g. "Blogpost".'
                        type="text"
                        field={field}
                        errors={collectionForm.formState.errors}
                        supportedLanguages={project.settings.language.supported}
                      />
                    </FormControl>
                    <FormDescription>
                      The name of each Entry inside your new Collection. Choose
                      a short name in singular - e.g. &quot;Blogpost&quot;.
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

            <FormField
              control={collectionForm.control}
              name="slug.plural"
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired>Collection-Slug</FormLabel>
                  <FormControl>
                    <FormInputField field={field} type="text" />
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
              control={collectionForm.control}
              name="slug.singular"
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired>Entry-Slug</FormLabel>
                  <FormControl>
                    <FormInputField field={field} type="text" />
                  </FormControl>
                  <FormDescription>
                    A lowercase version without any special characters of the
                    Entry's name. It's used to identify this Collection's
                    Entries and needs to be unique.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                            {fieldTypeSchema.options.map((option) => {
                              return (
                                <SelectItem
                                  key={option}
                                  value={option}
                                  disabled={unimplementedFieldTypes.has(option)}
                                >
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
                {fieldDefinitions.fields.map((field) => {
                  // Recover the real definition from the opaque id-row.
                  const fieldDefinition =
                    field as unknown as FieldDefinitionOrGroup & {
                      id: string;
                    };
                  // Groups are presentational, render their member fields inside
                  // a labeled FieldSet. Group authoring is not supported yet, so
                  // the members are shown read-only as a preview.
                  if ('isGroup' in fieldDefinition) {
                    return (
                      <DraggableComponent
                        key={fieldDefinition.id}
                        id={fieldDefinition.id}
                      >
                        <FieldSet className="col-span-12">
                          <FieldLegend>
                            {translateContent({
                              key: 'fieldDefinitionGroup.label',
                              record: fieldDefinition.label,
                            })}
                          </FieldLegend>
                          <FieldGroup className="grid grid-cols-12 gap-6">
                            {fieldDefinition.fieldDefinitions.map((member) => (
                              <FormFieldFromDefinition
                                key={member.id}
                                fieldDefinition={member}
                                form={collectionForm}
                                // @ts-ignore This is only to display the field
                                name={`currentFields.field-${member.id}.content`}
                                supportedLanguages={
                                  project.settings.language.supported
                                }
                              />
                            ))}
                          </FieldGroup>
                        </FieldSet>
                      </DraggableComponent>
                    );
                  }

                  return (
                    <DraggableComponent
                      key={fieldDefinition.id}
                      id={fieldDefinition.id}
                    >
                      <FormFieldFromDefinition
                        fieldDefinition={fieldDefinition}
                        form={collectionForm}
                        // @ts-ignore This is only to display the field, not to actually edit anything but the order of the fields
                        name={`currentFields.field-${fieldDefinition.id}.content`}
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
}
