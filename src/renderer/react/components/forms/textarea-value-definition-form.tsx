import { SupportedLanguage, TextareaValueDefinition } from '@elek-io/core';
import * as React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { cn } from '../../../../util';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  DefaultValueDefinitionForm,
  DefaultValueDefinitionFormProps,
} from './default-value-definition-form';
import { IsUniqueFormField } from './is-unique-form-field';
import { setValueAsNumber } from './util';

export type TextareaValueDefinitionFormProps =
  DefaultValueDefinitionFormProps<TextareaValueDefinition>;

const TextareaValueDefinitionForm = React.forwardRef<
  HTMLFormElement,
  TextareaValueDefinitionFormProps
>(({ className, state, ...props }, ref) => {
  return (
    <Form {...state}>
      <form className="space-y-6">
        <DefaultValueDefinitionForm state={state} {...props}>
          <FormField
            control={state.control}
            name={`defaultValue`}
            render={({ field }) => (
              <FormItem>
                <FormLabel isRequired={false}>Default value</FormLabel>
                <FormControl>
                  <Textarea {...field} />
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
                    <Input
                      {...field}
                      {...state.register('min', {
                        setValueAs: setValueAsNumber,
                      })}
                      type="number"
                    />
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
                    <Input
                      {...field}
                      {...state.register('max', {
                        setValueAs: setValueAsNumber,
                      })}
                      type="number"
                    />
                  </FormControl>
                  <FormDescription>
                    The maximum number of characters the user is able to enter.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </DefaultValueDefinitionForm>

        <IsUniqueFormField state={state} />
      </form>
    </Form>
  );
});
TextareaValueDefinitionForm.displayName = 'TextareaValueDefinitionForm';

export interface TextareaValueDefinitionFormExampleProps
  extends React.HTMLAttributes<HTMLFormElement> {
  state: UseFormReturn<TextareaValueDefinition>;
  currentLanguage: SupportedLanguage;
}

const TextareaValueDefinitionFormExample = React.forwardRef<
  HTMLFormElement,
  TextareaValueDefinitionFormExampleProps
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
TextareaValueDefinitionFormExample.displayName =
  'TextareaValueDefinitionFormExample';

export { TextareaValueDefinitionForm, TextareaValueDefinitionFormExample };
