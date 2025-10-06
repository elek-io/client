import { type ReactElement } from 'react';
import { type SubmitHandler, type UseFormReturn } from 'react-hook-form';

import { Form, FormFieldFromDefinition } from '@renderer/components/ui/form';
import { Page, type PageProps } from '@renderer/components/ui/page';

import {
  type CreateEntryProps,
  type FieldDefinition,
  type SupportedLanguage,
  type TranslatableString,
  type UpdateEntryProps,
} from '@elek-io/core';

interface CreateUpdateEntryPageProps extends PageProps {
  entryForm: UseFormReturn<CreateEntryProps | UpdateEntryProps>;
  fieldDefinitions: FieldDefinition[];
  supportedLanguages: SupportedLanguage[];
  defaultLanguage: SupportedLanguage;
  translateContent(key: string, record: TranslatableString): string;
  onFormSubmit: SubmitHandler<CreateEntryProps | UpdateEntryProps>;
}

function CreateUpdateEntryPage({
  entryForm,
  fieldDefinitions,
  supportedLanguages,
  defaultLanguage,
  translateContent,
  onFormSubmit,
  ...props
}: CreateUpdateEntryPageProps): ReactElement {
  return (
    <Page {...props}>
      <Form {...entryForm}>
        <form onSubmit={entryForm.handleSubmit(onFormSubmit)}>
          <div className="grid grid-cols-12 gap-x-4 gap-y-8 p-6 sm:gap-x-6 xl:gap-x-8">
            {fieldDefinitions.map((fieldDefinition, index) => {
              return (
                <FormFieldFromDefinition
                  key={fieldDefinition.id}
                  fieldDefinition={fieldDefinition}
                  form={entryForm}
                  name={`values.${index}.content.${defaultLanguage}`}
                  supportedLanguages={supportedLanguages}
                  translateContent={translateContent}
                />
              );
            })}
          </div>
        </form>
      </Form>
    </Page>
  );
}

export { CreateUpdateEntryPage };
