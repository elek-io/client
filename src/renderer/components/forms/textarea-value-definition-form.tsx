import type { ReactElement } from 'react';

import { FormInput } from '@renderer/components/form-input';
import { FormTextarea } from '@renderer/components/form-textarea';
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
} from '@renderer/components/ui/form';

import { type TextareaFieldDefinition } from '@elek-io/core';

export type TextareaFieldDefinitionFormProps =
  DefaultFieldDefinitionFormProps<TextareaFieldDefinition>;

const TextareaFieldDefinitionForm = ({
  form,
  ...props
}: TextareaFieldDefinitionFormProps): ReactElement => {
  return (
    <Form {...form}>
      <form className="space-y-6">
        <DefaultFieldDefinitionForm form={form} {...props}>
          <FormField
            control={form.control}
            name={`defaultValue`}
            render={({ field }) => (
              <FormItem>
                <FormLabel isRequired={false}>Default value</FormLabel>
                <FormControl>
                  <FormTextarea field={field} />
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
              name={`min`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired={false}>Minimum</FormLabel>
                  <FormControl>
                    <FormInput field={field} type="number" />
                  </FormControl>
                  <FormDescription>
                    The minimum number of characters the user is able to enter.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`max`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired={false}>Maximum</FormLabel>
                  <FormControl>
                    <FormInput field={field} type="number" />
                  </FormControl>
                  <FormDescription>
                    The maximum number of characters the user is able to enter.
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
TextareaFieldDefinitionForm.displayName = 'TextareaFieldDefinitionForm';

export { TextareaFieldDefinitionForm };
