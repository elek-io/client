import { RangeValueDefinition, SupportedLanguage } from '@elek-io/core';
import * as React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { cn } from '../../util';
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
import { Slider } from '../ui/slider';
import {
  DefaultValueDefinitionForm,
  DefaultValueDefinitionFormProps,
} from './default-value-definition-form';
import { setValueAsNumber } from './util';

export type RangeValueDefinitionFormProps =
  DefaultValueDefinitionFormProps<RangeValueDefinition>;

const RangeValueDefinitionForm = React.forwardRef<
  HTMLFormElement,
  RangeValueDefinitionFormProps
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
                <FormLabel isRequired={true}>Default value</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    {...state.register('defaultValue', {
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
              control={state.control}
              name={`min`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired={true}>Minimum</FormLabel>
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
                    The minimum Value the user is able to enter.
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
                  <FormLabel isRequired={true}>Maximum</FormLabel>
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
                    The maximum Value the user is able to enter.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </DefaultValueDefinitionForm>
      </form>
    </Form>
  );
});
RangeValueDefinitionForm.displayName = 'RangeValueDefinitionForm';

export interface RangeValueDefinitionFormFieldProps
  extends React.HTMLAttributes<HTMLFormElement> {
  state: UseFormReturn<RangeValueDefinition>;
  currentLanguage: SupportedLanguage;
}

const RangeValueDefinitionFormFieldExample = React.forwardRef<
  HTMLFormElement,
  RangeValueDefinitionFormFieldProps
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
            <Slider
              className={cn('bg-white dark:bg-zinc-900', className)}
              defaultValue={[state.watch('defaultValue')]}
              min={state.watch('min')}
              max={state.watch('max')}
              step={1}
              disabled={state.watch('isDisabled')}
            />
            {/* <Input
              {...state.register(field.name, { setValueAs: setValueAsNumber })}
              type="number"
              
            /> */}
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
RangeValueDefinitionFormFieldExample.displayName =
  'RangeValueDefinitionFormFieldExample';

export { RangeValueDefinitionForm, RangeValueDefinitionFormFieldExample };
