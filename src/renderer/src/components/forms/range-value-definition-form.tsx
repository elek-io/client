import { RangeFieldDefinition, SupportedLanguage } from '@elek-io/core';
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
import { Slider } from '../ui/slider';
import {
  DefaultFieldDefinitionForm,
  DefaultFieldDefinitionFormProps,
} from './default-field-definition-form';

export type RangeFieldDefinitionFormProps =
  DefaultFieldDefinitionFormProps<RangeFieldDefinition>;

const RangeFieldDefinitionForm = React.forwardRef<
  HTMLFormElement,
  RangeFieldDefinitionFormProps
>(({ className, form: state, ...props }) => {
  return (
    <Form {...state}>
      <form className="space-y-6">
        <DefaultFieldDefinitionForm form={state} {...props}>
          <FormField
            control={state.control}
            name={`defaultValue`}
            render={({ field }) => (
              <FormItem>
                <FormLabel isRequired={true}>Default value</FormLabel>
                <FormControl>
                  <FormInput field={field} type="number" />
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
                    <FormInput field={field} type="number" />
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
                    <FormInput field={field} type="number" />
                  </FormControl>
                  <FormDescription>
                    The maximum Value the user is able to enter.
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
RangeFieldDefinitionForm.displayName = 'RangeFieldDefinitionForm';

export interface RangeFieldDefinitionFormFieldProps
  extends React.HTMLAttributes<HTMLFormElement> {
  state: UseFormReturn<RangeFieldDefinition>;
  currentLanguage: SupportedLanguage;
}

const RangeFieldDefinitionFormFieldExample = React.forwardRef<
  HTMLFormElement,
  RangeFieldDefinitionFormFieldProps
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
RangeFieldDefinitionFormFieldExample.displayName =
  'RangeFieldDefinitionFormFieldExample';

export { RangeFieldDefinitionForm, RangeFieldDefinitionFormFieldExample };
