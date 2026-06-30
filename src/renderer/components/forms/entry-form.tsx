import {
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

import {
  type CreateEntryProps,
  type FieldDefinitionOrGroup,
  type Project,
  type UpdateEntryProps,
} from '@elek-io/core';

interface EntryFormProps<TFieldValues extends FieldValues> {
  entryForm: UseFormReturn<TFieldValues>;
  fieldDefinitions: FieldDefinitionOrGroup[];
  project: Project;
  children?: React.ReactNode;
  isViewOnly?: boolean;
  onFormSubmit: SubmitHandler<TFieldValues>;
}

export function EntryForm({
  entryForm,
  fieldDefinitions,
  project,
  children,
  isViewOnly = false,
  onFormSubmit,
}: EntryFormProps<CreateEntryProps | UpdateEntryProps>): React.JSX.Element {
  const { translateContent } = useProject();

  return (
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
                          form={entryForm}
                          name={`values.${member.slug}.content.${project.settings.language.default}`}
                          supportedLanguages={project.settings.language.supported}
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
                  form={entryForm}
                  name={`values.${fieldDefinition.slug}.content.${project.settings.language.default}`}
                  supportedLanguages={project.settings.language.supported}
                />
              );
            })}
          </div>
          {children}
        </fieldset>
      </form>
    </Form>
  );
}
