import { cn } from '@/util';
import { NumberValueDefinition, SupportedLanguage } from '@elek-io/shared';
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
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { DefaultValueDefinitionForm } from './default-value-definition-form';
import { setValueAsNumber } from './util';

export interface NumberValueDefinitionFormProps
  extends React.HTMLAttributes<HTMLFormElement> {
  state: UseFormReturn<NumberValueDefinition>;
  supportedLanguages: SupportedLanguage[];
  currentLanguage: SupportedLanguage;
}

const NumberValueDefinitionForm = React.forwardRef<
  HTMLFormElement,
  NumberValueDefinitionFormProps
>((props, ref) => {
  return (
    <Form {...props.state}>
      <form className="space-y-6">
        <DefaultValueDefinitionForm {...props}>
          <FormField
            control={props.state.control}
            name={`defaultValue`}
            render={({ field }) => (
              <FormItem>
                <FormLabel isRequired={false}>Default value</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    {...props.state.register('defaultValue', {
                      setValueAs: setValueAsNumber,
                    })}
                    type="number"
                  />
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
              control={props.state.control}
              name={`min`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired={false}>Minimum</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      {...props.state.register('min', {
                        setValueAs: setValueAsNumber,
                      })}
                      type="number"
                    />
                  </FormControl>
                  <FormDescription>
                    The minimum Value the user is able to enter.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={props.state.control}
              name={`max`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired={false}>Maximum</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      {...props.state.register('max', {
                        setValueAs: setValueAsNumber,
                      })}
                      type="number"
                    />
                  </FormControl>
                  <FormDescription>
                    The maximum Value the user is able to enter.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </DefaultValueDefinitionForm>

        <FormField
          control={props.state.control}
          name={`isUnique`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm">
              <div>
                <FormLabel isRequired={true}>Unique</FormLabel>
                <FormDescription>
                  You won't be able to create an Entry if there is an existing
                  Entry with identical content.
                </FormDescription>
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
      </form>
    </Form>
  );
});
NumberValueDefinitionForm.displayName = 'NumberValueDefinitionForm';

export interface NumberValueDefinitionFormFieldProps
  extends React.HTMLAttributes<HTMLFormElement> {
  state: UseFormReturn<NumberValueDefinition>;
  currentLanguage: SupportedLanguage;
}

const NumberValueDefinitionFormFieldExample = React.forwardRef<
  HTMLFormElement,
  NumberValueDefinitionFormFieldProps
>(({ className, state, currentLanguage, ...props }, ref) => {
  return (
    <FormField
      control={state.control}
      // @ts-ignore It's just an example
      name={'example'}
      render={({ field }) => (
        <FormItem>
          <FormLabel isRequired={state.watch('isRequired')}>
            {state.watch(`name.${currentLanguage}`)}
          </FormLabel>
          <FormControl>
            <Input
              {...state.register(field.name, { setValueAs: setValueAsNumber })}
              className={cn('bg-white dark:bg-zinc-900', className)}
              type="number"
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
NumberValueDefinitionFormFieldExample.displayName =
  'NumberValueDefinitionFormFieldExample';

export { NumberValueDefinitionForm, NumberValueDefinitionFormFieldExample };
