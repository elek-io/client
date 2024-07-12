import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '../ui/form';
import { Switch } from '../ui/switch';

export interface IsUniqueFormFieldProps<T> {
  state: UseFormReturn<T>;
}

const IsUniqueFormField = React.forwardRef<
  HTMLFormElement,
  IsUniqueFormFieldProps<any>
>(({ state, ...props }) => {
  return (
    <FormField
      control={state.control}
      name={`isUnique`}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm">
          <div>
            <FormLabel isRequired={true}>Unique</FormLabel>
            <FormDescription>
              You won't be able to create an Entry if there is an existing Entry
              with identical content.
            </FormDescription>
          </div>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  );
});
IsUniqueFormField.displayName = 'IsUniqueFormField';

export { IsUniqueFormField };
