import {
  SupportedLanguage,
  TextValueDefinition,
  textValueDefinitionSchema,
  uuid,
} from '@elek-io/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
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
  language: SupportedLanguage;
  onHandleSubmit: SubmitHandler<TextValueDefinition>;
}

const TextValueDefinitionForm = React.forwardRef<
  HTMLFormElement,
  TextValueDefinitionFormProps
>(({ className, ...props }, ref) => {
  const formHook = useForm<TextValueDefinition>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      console.log(
        'TextValueDefinition validation result',
        await zodResolver(textValueDefinitionSchema)(data, context, options)
      );
      return zodResolver(textValueDefinitionSchema)(data, context, options);
    },
    defaultValues: {
      id: uuid(),
      name: {
        [props.language]: '',
      },
      description: {
        [props.language]: '',
      },
      valueType: 'string',
      inputType: 'text',
      inputWidth: '12',
      defaultValue: '',
      min: 0,
      max: 250,
      isRequired: true,
      isUnique: false,
      isDisabled: false,
    },
  });

  return (
    <Form {...formHook}>
      <form onSubmit={formHook.handleSubmit(props.onHandleSubmit)}>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            <FormField
              control={formHook.control}
              name={`name.${props.language}`}
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
              control={formHook.control}
              name={`description.${props.language}`}
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
              control={formHook.control}
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
                    Required fields need to be filled before a CollectionItem
                    can be created or updated
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={formHook.control}
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
              control={formHook.control}
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
          </div>
          <div className="col-span-4">
            <div className="sticky top-6">
              <FormField
                control={formHook.control}
                // @ts-ignore: This is just the example input
                name={`example`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {formHook.watch(`name.${props.language}`) || 'Example'}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} value="" />
                    </FormControl>
                    <FormDescription>
                      {formHook.watch(`description.${props.language}`)}
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <Button onClick={formHook.handleSubmit(props.onHandleSubmit)}>
          Add Field definition
        </Button>
      </form>
    </Form>
  );
});
TextValueDefinitionForm.displayName = 'TextValueDefinitionForm';

export { TextValueDefinitionForm };
