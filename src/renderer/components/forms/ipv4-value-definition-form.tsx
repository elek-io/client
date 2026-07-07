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
  FormInputField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@renderer/components/ui/form';

import { type Ipv4FieldDefinition } from '@elek-io/core';

export type Ipv4FieldDefinitionFormProps =
  DefaultFieldDefinitionFormProps<Ipv4FieldDefinition>;

export const Ipv4FieldDefinitionForm = ({
  form,
  ...props
}: Ipv4FieldDefinitionFormProps): ReactElement => {
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
                  <FormInputField
                    type="ipv4"
                    placeholder="192.168.1.1"
                    field={field}
                  />
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
