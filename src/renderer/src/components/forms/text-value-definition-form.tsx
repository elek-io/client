import { SupportedLanguage, TextFieldDefinition } from '@elek-io/core';
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
import { FormInput } from '../ui/form-input';
import { Input } from '../ui/input';
import {
  DefaultFieldDefinitionForm,
  DefaultFieldDefinitionFormProps,
} from './default-field-definition-form';

export type TextFieldDefinitionFormProps =
  DefaultFieldDefinitionFormProps<TextFieldDefinition>;

const TextFieldDefinitionForm = React.forwardRef<
  HTMLFormElement,
  TextFieldDefinitionFormProps
>(({ className, form, ...props }, ref) => {
  return (
    <Form {...form}>
      <form className="space-y-6">
        {JSON.stringify(form.watch())}
        <DefaultFieldDefinitionForm form={form} {...props}>
          <FormField
            control={form.control}
            name={`defaultValue`}
            render={({ field }) => (
              <FormItem>
                <FormLabel isRequired={false}>Default value</FormLabel>
                <FormControl>
                  <FormInput field={field} type="text" />
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
});
TextFieldDefinitionForm.displayName = 'TextFieldDefinitionForm';

export interface TextFieldDefinitionFormExampleProps
  extends React.HTMLAttributes<HTMLFormElement> {
  state: UseFormReturn<TextFieldDefinition>;
  currentLanguage: SupportedLanguage;
}

const TextFieldDefinitionFormExample = React.forwardRef<
  HTMLFormElement,
  TextFieldDefinitionFormExampleProps
>(({ className, state, currentLanguage, ...props }, ref) => {
  return (
    <FormField
      control={state.control}
      // @ts-expect-error It's just an example
      name={'example'}
      render={({ field }) => (
        <FormItem>
          <FormLabel isRequired={state.watch('isRequired')}>
            {state.watch(`label.${currentLanguage}`)}
          </FormLabel>
          <FormControl>
            {/* {InputFromDefinition()} */}
            <Input
              className={cn('bg-white dark:bg-zinc-900', className)}
              type="text"
              min={state.watch('min')}
              max={state.watch('max')}
              defaultValue={state.watch('defaultValue')}
              required={state.watch('isRequired')}
              disabled={state.watch('isDisabled')}
            />
          </FormControl>
          <FormDescription>
            {state.watch(`description.${currentLanguage}`)}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
});
TextFieldDefinitionFormExample.displayName = 'TextFieldDefinitionFormExample';

export { TextFieldDefinitionForm, TextFieldDefinitionFormExample };
