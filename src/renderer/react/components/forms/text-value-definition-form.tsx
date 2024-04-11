import { SupportedLanguage, TextValueDefinition } from '@elek-io/shared';
import * as React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '../ui/form';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';

export interface TextValueDefinitionFormProps
  extends React.HTMLAttributes<HTMLFormElement> {
  state: UseFormReturn<TextValueDefinition>;
  currentLanguage: SupportedLanguage;
}

const TextValueDefinitionForm = React.forwardRef<
  HTMLFormElement,
  TextValueDefinitionFormProps
>(({ className, state, ...props }, ref) => {
  return (
    <Form {...state}>
      <form className="space-y-6">
        <FormField
          control={state.control}
          name={`name.${props.currentLanguage}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={state.control}
          name={`description.${props.currentLanguage}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormDescription>
                Describe what to input into this field. This text will be
                displayed under the field to guide users
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={state.control}
          name={`isRequired`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm">
              <div>
                <FormLabel>Required</FormLabel>
                <FormDescription>
                  Required fields need to be filled before a CollectionItem can
                  be created or updated
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
          name={`isUnique`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm">
              <div>
                <FormLabel>Unique</FormLabel>
                <FormDescription>
                  You won't be able to create an Entry if there is an existing
                  Entry with identical content
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
                  You won't be able to change the Value if this is active
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
TextValueDefinitionForm.displayName = 'TextValueDefinitionForm';

export interface TextValueDefinitionFormExampleProps
  extends React.HTMLAttributes<HTMLFormElement> {
  state: UseFormReturn<TextValueDefinition>;
  currentLanguage: SupportedLanguage;
}

const TextValueDefinitionFormExample = React.forwardRef<
  HTMLFormElement,
  TextValueDefinitionFormExampleProps
>(({ className, state, ...props }, ref) => {
  return (
    <FormField
      control={state.control}
      // @ts-ignore: This is just the example input
      name={`example`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{state.watch(`name.${props.currentLanguage}`)}</FormLabel>
          <FormControl>
            <Input
              {...field}
              required={state.watch('isRequired')}
              disabled={state.watch('isDisabled')}
              value=""
              className="bg-white dark:bg-zinc-900"
            />
          </FormControl>
          <FormDescription>
            {state.watch(`description.${props.currentLanguage}`)}
          </FormDescription>
        </FormItem>
      )}
    />
  );
});
TextValueDefinitionFormExample.displayName = 'TextValueDefinitionFormExample';

export { TextValueDefinitionForm, TextValueDefinitionFormExample };
