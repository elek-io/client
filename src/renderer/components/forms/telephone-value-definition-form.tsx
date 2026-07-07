import { type ReactElement } from 'react';

import {
  DefaultFieldDefinitionForm,
  type DefaultFieldDefinitionFormProps,
} from '@renderer/components/forms/default-field-definition-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormInputField,
} from '@renderer/components/ui/form';

import { type TelephoneFieldDefinition } from '@elek-io/core';

export type TelephoneFieldDefinitionFormProps =
  DefaultFieldDefinitionFormProps<TelephoneFieldDefinition>;

export const TelephoneFieldDefinitionForm = ({
  form,
  ...props
}: TelephoneFieldDefinitionFormProps): ReactElement => {
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
                  <FormInputField field={field} type="telephone" />
                </FormControl>
                <FormDescription>
                  The initial value for the field.
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
