import { SupportedLanguage, TextValueDefinition } from '@elek-io/shared';
import * as React from 'react';
import { SubmitHandler, UseFormReturn } from 'react-hook-form';
import { Button } from '../ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '../ui/form';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';

export interface TextValueDefinitionFormProps
  extends React.HTMLAttributes<HTMLFormElement> {
  state: UseFormReturn<TextValueDefinition>;
  currentLanguage: SupportedLanguage;
  onHandleSubmit: SubmitHandler<TextValueDefinition>;
}

const TextValueDefinitionForm = React.forwardRef<
  HTMLFormElement,
  TextValueDefinitionFormProps
>(({ className, state, ...props }, ref) => {
  return (
    <Form {...state}>
      <form onSubmit={state.handleSubmit(props.onHandleSubmit)}>
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

        <hr className="p-2" />

        <FormField
          control={state.control}
          name={`isRequired`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Required</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Required fields need to be filled before a CollectionItem can be
                created or updated
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={state.control}
          name={`isUnique`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unique</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                You won't be able to create an Entry if there is an existing
                Entry with identical content
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
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
        />

        <Button onClick={state.handleSubmit(props.onHandleSubmit)}>
          Add Field definition
        </Button>
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
          <FormLabel>
            {state.watch(`name.${props.currentLanguage}`) || 'Example'}
          </FormLabel>
          <FormControl>
            <Input {...field} value="" className="bg-white dark:bg-zinc-900" />
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
