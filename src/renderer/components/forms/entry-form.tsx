import {
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from 'react-hook-form';

import { Form, FormFieldFromDefinition } from '@renderer/components/ui/form';

import {
  type CreateEntryProps,
  type FieldDefinition,
  type Project,
  type UpdateEntryProps,
} from '@elek-io/core';

interface EntryFormProps<TFieldValues extends FieldValues> {
  entryForm: UseFormReturn<TFieldValues>;
  fieldDefinitions: FieldDefinition[];
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
  return (
    <Form {...entryForm}>
      <form onSubmit={entryForm.handleSubmit(onFormSubmit)}>
        <fieldset disabled={isViewOnly}>
          <div className="grid grid-cols-12 gap-x-4 gap-y-8 p-6 sm:gap-x-6 xl:gap-x-8">
            {fieldDefinitions.map((fieldDefinition, index) => {
              return (
                <FormFieldFromDefinition
                  key={fieldDefinition.id}
                  fieldDefinition={fieldDefinition}
                  form={entryForm}
                  name={`values.${index}.content.${project.settings.language.default}`}
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
