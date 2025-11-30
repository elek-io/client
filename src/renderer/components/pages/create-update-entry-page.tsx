import {
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from 'react-hook-form';

import { Page, type PageProps } from '@renderer/components/page';
import { Form, FormFieldFromDefinition } from '@renderer/components/ui/form';
import { Skeleton } from '@renderer/components/ui/skeleton';

import {
  type CreateEntryProps,
  type FieldDefinition,
  type SupportedLanguage,
  type UpdateEntryProps,
} from '@elek-io/core';

interface CreateUpdateEntryPageProps<TFieldValues extends FieldValues>
  extends PageProps {
  entryForm: UseFormReturn<TFieldValues>;
  fieldDefinitions: FieldDefinition[];
  supportedLanguages: SupportedLanguage[];
  defaultLanguage: SupportedLanguage;
  onFormSubmit: SubmitHandler<TFieldValues>;
}

export function CreateUpdateEntryPage({
  entryForm,
  fieldDefinitions,
  supportedLanguages,
  defaultLanguage,
  onFormSubmit,
  ...props
}: CreateUpdateEntryPageProps<
  CreateEntryProps | UpdateEntryProps
>): React.JSX.Element {
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
                />
              );
            })}
          </div>
        </form>
      </Form>
    </Page>
  );
}

export function CreateUpdateEntryPageSkeleton(
  props: PageProps
): React.JSX.Element {
  return (
    <Page {...props}>
      <div className="grid grid-cols-12 gap-x-4 gap-y-8 p-6 sm:gap-x-6 xl:gap-x-8">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </Page>
  );
}
