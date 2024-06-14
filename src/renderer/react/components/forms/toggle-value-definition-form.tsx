import { cn } from '@/util';
import { SupportedLanguage, ToggleValueDefinition } from '@elek-io/shared';
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
  DefaultValueDefinitionForm,
  DefaultValueDefinitionFormProps,
} from './default-value-definition-form';

export interface ToggleValueDefinitionFormProps
  extends DefaultValueDefinitionFormProps<ToggleValueDefinition> {}

const ToggleValueDefinitionForm = React.forwardRef<
  HTMLFormElement,
  ToggleValueDefinitionFormProps
>(({ className, state, ...props }, ref) => {
  return (
    <Form {...state}>
      <form className="space-y-6">
        <DefaultValueDefinitionForm state={state} {...props}>
          <FormField
            control={state.control}
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
        </DefaultValueDefinitionForm>
      </form>
    </Form>
  );
});
ToggleValueDefinitionForm.displayName = 'ToggleValueDefinitionForm';

export interface ToggleValueDefinitionFormExampleProps
  extends React.HTMLAttributes<HTMLFormElement> {
  state: UseFormReturn<ToggleValueDefinition>;
  currentLanguage: SupportedLanguage;
}

const ToggleValueDefinitionFormExample = React.forwardRef<
  HTMLFormElement,
  ToggleValueDefinitionFormExampleProps
>(({ className, state, currentLanguage, ...props }, ref) => {
  return (
    <FormField
      control={state.control}
      // @ts-ignore It's just an example
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
ToggleValueDefinitionFormExample.displayName =
  'ToggleValueDefinitionFormExample';

export { ToggleValueDefinitionForm, ToggleValueDefinitionFormExample };
