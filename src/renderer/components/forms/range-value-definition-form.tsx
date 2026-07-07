import type { ReactElement } from 'react';

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

import { type RangeFieldDefinition } from '@elek-io/core';

export type RangeFieldDefinitionFormProps =
  DefaultFieldDefinitionFormProps<RangeFieldDefinition>;

const RangeFieldDefinitionForm = ({
  form,
  ...props
}: RangeFieldDefinitionFormProps): ReactElement => {
  return (
    <Form {...form}>
      <form className="space-y-6">
        <DefaultFieldDefinitionForm form={form} {...props}>
          <FormField
            control={form.control}
            name="defaultValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel isRequired>Default value</FormLabel>
                <FormControl>
                  <FormInputField field={field} type="number" />
                </FormControl>
                <FormDescription>
                  The initial value for the field.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-row items-center justify-between space-x-2">
            <FormField
              control={form.control}
              name="min"
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired>Minimum</FormLabel>
                  <FormControl>
                    <FormInputField field={field} type="number" />
                  </FormControl>
                  <FormDescription>
                    The minimum Value the user is able to enter.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max"
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired>Maximum</FormLabel>
                  <FormControl>
                    <FormInputField field={field} type="number" />
                  </FormControl>
                  <FormDescription>
                    The maximum Value the user is able to enter.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </DefaultFieldDefinitionForm>
      </form>
    </Form>
  );
};
RangeFieldDefinitionForm.displayName = 'RangeFieldDefinitionForm';

export { RangeFieldDefinitionForm };
