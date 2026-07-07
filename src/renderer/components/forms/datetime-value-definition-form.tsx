import { type ReactElement } from 'react';

import {
  DefaultFieldDefinitionForm,
  type DefaultFieldDefinitionFormProps,
} from '@renderer/components/forms/default-field-definition-form';
import {
  Form,
  FormControl,
  FormDatetimeField,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@renderer/components/ui/form';

import { type DatetimeFieldDefinition } from '@elek-io/core';

export type DatetimeFieldDefinitionFormProps =
  DefaultFieldDefinitionFormProps<DatetimeFieldDefinition>;

export const DatetimeFieldDefinitionForm = ({
  form,
  ...props
}: DatetimeFieldDefinitionFormProps): ReactElement => {
  return (
    <Form {...form}>
      <form className="space-y-6">
        <DefaultFieldDefinitionForm form={form} {...props}>
          <FormField
            control={form.control}
            name="defaultValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel isRequired={false}>Default value</FormLabel>
                <FormControl>
                  <FormDatetimeField field={field} />
                </FormControl>
                <FormDescription>
                  The initial value for the field. It is shown in your local
                  time and stored as UTC.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </DefaultFieldDefinitionForm>
      </form>
    </Form>
  );
};
