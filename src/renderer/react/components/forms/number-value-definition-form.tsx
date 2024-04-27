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
import { Textarea } from '../ui/textarea';
import { setValueAsNumber } from './util';

export interface NumberValueDefinitionFormProps
  extends React.HTMLAttributes<HTMLFormElement> {
  state: UseFormReturn<NumberValueDefinition>;
  currentLanguage: SupportedLanguage;
}

const NumberValueDefinitionForm = React.forwardRef<
  HTMLFormElement,
  NumberValueDefinitionFormProps
>(({ className, state, currentLanguage, ...props }, ref) => {
  return (
    <Form {...state}>
      <form className="space-y-6">
        <FormField
          control={state.control}
          name={`name.${currentLanguage}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={state.control}
          name={`description.${currentLanguage}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormDescription>
                Describe what to input into this field. This text will be
                displayed under the field to guide users.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={state.control}
          name={`defaultValue`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default value</FormLabel>
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
                <FormLabel>Minimum</FormLabel>
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
                <FormLabel>Maximum</FormLabel>
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

        <FormField
          control={state.control}
          name={`isRequired`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm">
              <div>
                <FormLabel>Required</FormLabel>
                <FormDescription>
                  Required fields need to be filled before a CollectionItem can
                  be created or updated.
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

        <FormField
          control={state.control}
          name={`isUnique`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm">
              <div>
                <FormLabel>Unique</FormLabel>
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

        <FormField
          control={state.control}
          name={`isDisabled`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm">
              <div>
                <FormLabel>Disabled</FormLabel>
                <FormDescription>
                  You won't be able to change the Value if this is active.
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

        {/* <FormField
          control={state.control}
          name={`inputWidth`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Field width</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} {...field}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select an icon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3/12</SelectItem>
                    <SelectItem value="4">4/12</SelectItem>
                    <SelectItem value="6">6/12</SelectItem>
                    <SelectItem value="12">12/12</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        /> */}
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
          <FormLabel>{state.watch(`name.${currentLanguage}`)}</FormLabel>
          <FormControl>
            <Input
              {...field}
              {...state.register(field.name, { setValueAs: setValueAsNumber })}
              className={cn('bg-white dark:bg-zinc-900', className)}
              type="number"
              min={state.watch('min')}
              max={state.watch('max')}
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
