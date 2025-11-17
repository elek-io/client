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
  FormItem,
  FormLabel,
  FormMessage,
} from '@renderer/components/ui/form';
import { Switch } from '@renderer/components/ui/switch';

import { type ToggleFieldDefinition } from '@elek-io/core';

export type ToggleFieldDefinitionFormProps =
  DefaultFieldDefinitionFormProps<ToggleFieldDefinition>;

const ToggleFieldDefinitionForm = ({
  form,
  ...props
}: ToggleFieldDefinitionFormProps): ReactElement => {
  return (
    <Form {...form}>
      <form className="space-y-6">
        <DefaultFieldDefinitionForm form={form} {...props}>
          <FormField
            control={form.control}
            name="defaultValue"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 p-3 shadow-xs dark:border-zinc-800">
                <div>
                  <FormLabel isRequired>Default value</FormLabel>
                  <FormDescription>
                    The initial value for the field.
                  </FormDescription>
                  <FormMessage />
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </DefaultFieldDefinitionForm>
      </form>
    </Form>
  );
};
ToggleFieldDefinitionForm.displayName = 'ToggleFieldDefinitionForm';

export { ToggleFieldDefinitionForm };
