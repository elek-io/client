import { SupportedLanguage, ToggleFieldDefinition } from '@elek-io/core';
import { cn } from '@renderer/util';
import * as React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Switch } from '../ui/switch';
import {
  DefaultFieldDefinitionForm,
  DefaultFieldDefinitionFormProps,
} from './default-field-definition-form';

export type ToggleFieldDefinitionFormProps =
  DefaultFieldDefinitionFormProps<ToggleFieldDefinition>;

const ToggleFieldDefinitionForm = React.forwardRef<
  HTMLFormElement,
  ToggleFieldDefinitionFormProps
>(({ className, form, ...props }, ref) => {
  return (
    <Form {...form}>
      <form className="space-y-6">
        <DefaultFieldDefinitionForm form={form} {...props}>
          <FormField
            control={form.control}
            name={`defaultValue`}
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm">
                <div>
                  <FormLabel isRequired={true}>Default value</FormLabel>
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
});
ToggleFieldDefinitionForm.displayName = 'ToggleFieldDefinitionForm';

export interface ToggleFieldDefinitionFormExampleProps
  extends React.HTMLAttributes<HTMLFormElement> {
  state: UseFormReturn<ToggleFieldDefinition>;
  currentLanguage: SupportedLanguage;
}

const ToggleFieldDefinitionFormExample = React.forwardRef<
  HTMLFormElement,
  ToggleFieldDefinitionFormExampleProps
>(({ className, state, currentLanguage, ...props }, ref) => {
  return (
    <FormField
      control={state.control}
      // @ts-expect-error It's just an example
      name={'example'}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm">
          <div>
            <FormLabel isRequired={state.watch('isRequired')}>
              {state.watch(`label.${currentLanguage}`)}
            </FormLabel>
            <FormDescription>
              {state.watch(`description.${currentLanguage}`)}
            </FormDescription>
            <FormMessage />
          </div>
          <FormControl>
            <Switch
              className={cn('bg-white dark:bg-zinc-900', className)}
              checked={state.watch('defaultValue')}
              required={state.watch('isRequired')}
              disabled={state.watch('isDisabled')}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
});
ToggleFieldDefinitionFormExample.displayName =
  'ToggleFieldDefinitionFormExample';

export { ToggleFieldDefinitionForm, ToggleFieldDefinitionFormExample };
