import { SupportedLanguage, TextareaFieldDefinition } from '@elek-io/core';
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
import { FormTextarea } from '../ui/form-textarea';
import { Textarea } from '../ui/textarea';
import {
  DefaultFieldDefinitionForm,
  DefaultFieldDefinitionFormProps,
} from './default-field-definition-form';

export type TextareaFieldDefinitionFormProps =
  DefaultFieldDefinitionFormProps<TextareaFieldDefinition>;

const TextareaFieldDefinitionForm = React.forwardRef<
  HTMLFormElement,
  TextareaFieldDefinitionFormProps
>(({ className, form: state, ...props }, ref) => {
  return (
    <Form {...state}>
      <form className="space-y-6">
        <DefaultFieldDefinitionForm form={state} {...props}>
          <FormField
            control={state.control}
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
              control={state.control}
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
              control={state.control}
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
TextareaFieldDefinitionForm.displayName = 'TextareaFieldDefinitionForm';

export interface TextareaFieldDefinitionFormExampleProps
  extends React.HTMLAttributes<HTMLFormElement> {
  state: UseFormReturn<TextareaFieldDefinition>;
  currentLanguage: SupportedLanguage;
}

const TextareaFieldDefinitionFormExample = React.forwardRef<
  HTMLFormElement,
  TextareaFieldDefinitionFormExampleProps
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
            <Textarea
              className={cn('bg-white dark:bg-zinc-900', className)}
              minLength={state.watch('min')}
              maxLength={state.watch('max')}
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
TextareaFieldDefinitionFormExample.displayName =
  'TextareaFieldDefinitionFormExample';

export { TextareaFieldDefinitionForm, TextareaFieldDefinitionFormExample };
