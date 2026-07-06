import {
  type FieldPath,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from 'react-hook-form';

import {
  FieldGroup,
  FieldLegend,
  FieldSet,
} from '@renderer/components/ui/field';
import { Form, FormFieldFromDefinition } from '@renderer/components/ui/form';
import { useProject } from '@renderer/hooks/useProject';
import { FieldDefinitionsProvider } from '@renderer/providers/FieldDefinitionsProvider';

import { type FieldDefinitionOrGroup, type Project } from '@elek-io/core';

// The minimal shape an entry form holds for its dynamic Values. Every entry form
// (create, update, diff) stores Values under a slug-keyed record, which is exactly
// the input shape of the generated entry schemas (values: Record<string, unknown>).
// Constraining to this lets EntryForm address value paths for any concrete caller
// without viewing the form as a Props union.
type EntryFormValues = FieldValues & { values: Record<string, unknown> };

// TFieldValues is the form's value shape (the schema input, where Values are a
// loose Record). TTransformedValues is what handleSubmit yields after validation
// (the schema output, e.g. CreateEntryProps). Keeping both generic lets the form
// hold loose Values while the submit handler stays strongly typed.
interface EntryFormProps<
  TFieldValues extends EntryFormValues,
  TTransformedValues extends FieldValues,
> {
  entryForm: UseFormReturn<TFieldValues, unknown, TTransformedValues>;
  fieldDefinitions: FieldDefinitionOrGroup[];
  project: Project;
  children?: React.ReactNode;
  isViewOnly?: boolean;
  onFormSubmit: SubmitHandler<TTransformedValues>;
}

export function EntryForm<
  TFieldValues extends EntryFormValues,
  TTransformedValues extends FieldValues,
>({
  entryForm,
  fieldDefinitions,
  project,
  children,
  isViewOnly = false,
  onFormSubmit,
}: EntryFormProps<TFieldValues, TTransformedValues>): React.JSX.Element {
  const { translateContent } = useProject();
  const defaultLanguage = project.settings.language.default;

  // FormFieldFromDefinition only reads the form's control to register inputs, so the
  // submit (transformed) type is irrelevant to it. View the form by its field values
  // so it stays single-generic and the dual generic does not leak into form.tsx.
  const fieldForm = entryForm as unknown as UseFormReturn<TFieldValues>;

  // The path is provably a key of `values` (a Record), but react-hook-form's
  // FieldPath cannot reduce that for an unresolved generic, so assert it once here.
  const valuePath = (slug: string): FieldPath<TFieldValues> =>
    `values.${slug}.content.${defaultLanguage}` as FieldPath<TFieldValues>;

  return (
    <FieldDefinitionsProvider fieldDefinitions={fieldDefinitions}>
      <Form {...entryForm}>
        <form onSubmit={entryForm.handleSubmit(onFormSubmit)}>
          <fieldset disabled={isViewOnly}>
            <div className="grid grid-cols-12 gap-x-4 gap-y-8 p-6 sm:gap-x-6 xl:gap-x-8">
              {fieldDefinitions.map((fieldDefinition) => {
                // Groups are presentational, render their member fields inside a
                // labeled FieldSet that spans the full width of the form grid.
                if ('isGroup' in fieldDefinition) {
                  return (
                    <FieldSet key={fieldDefinition.id} className="col-span-12">
                      <FieldLegend>
                        {translateContent({
                          key: 'fieldDefinitionGroup.label',
                          record: fieldDefinition.label,
                        })}
                      </FieldLegend>
                      <FieldGroup className="grid grid-cols-12 gap-x-4 gap-y-8 sm:gap-x-6 xl:gap-x-8">
                        {fieldDefinition.fieldDefinitions.map((member) => (
                          <FormFieldFromDefinition
                            key={member.id}
                            fieldDefinition={member}
                            form={fieldForm}
                            name={valuePath(member.slug)}
                            supportedLanguages={
                              project.settings.language.supported
                            }
                          />
                        ))}
                      </FieldGroup>
                    </FieldSet>
                  );
                }

                return (
                  <FormFieldFromDefinition
                    key={fieldDefinition.id}
                    fieldDefinition={fieldDefinition}
                    form={fieldForm}
                    name={valuePath(fieldDefinition.slug)}
                    supportedLanguages={project.settings.language.supported}
                  />
                );
              })}
            </div>
            {children}
          </fieldset>
        </form>
      </Form>
    </FieldDefinitionsProvider>
  );
}
