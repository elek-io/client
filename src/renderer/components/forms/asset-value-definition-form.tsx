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

import { type AssetFieldDefinition } from '@elek-io/core';

export type AssetFieldDefinitionFormProps =
  DefaultFieldDefinitionFormProps<AssetFieldDefinition>;

const AssetFieldDefinitionForm = ({
  form,
  ...props
}: AssetFieldDefinitionFormProps): ReactElement => {
  return (
    <Form {...form}>
      <form className="space-y-6">
        <DefaultFieldDefinitionForm form={form} {...props}>
          <div className="flex flex-row items-center justify-between space-x-2">
            <FormField
              control={form.control}
              name="min"
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired={false}>Minimum</FormLabel>
                  <FormControl>
                    <FormInputField field={field} type="number" />
                  </FormControl>
                  <FormDescription>
                    The minimum number of Assets the user needs to select.
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
                  <FormLabel isRequired={false}>Maximum</FormLabel>
                  <FormControl>
                    <FormInputField field={field} type="number" />
                  </FormControl>
                  <FormDescription>
                    The maximum number of Assets the user is able to select.
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
AssetFieldDefinitionForm.displayName = 'AssetFieldDefinitionForm';

export { AssetFieldDefinitionForm };
