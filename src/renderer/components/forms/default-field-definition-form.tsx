import { Fragment, type HTMLAttributes, type ReactElement } from 'react';
import { type FieldValues, type UseFormReturn } from 'react-hook-form';

import { TranslatableFormTextarea } from '@renderer/components/form-textarea';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  TranslatableFormInputField,
} from '@renderer/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select';
import { Separator } from '@renderer/components/ui/separator';
import { Switch } from '@renderer/components/ui/switch';

import {
  FieldWidthSchema,
  type FieldDefinition,
  type FieldType,
  type SupportedLanguage,
} from '@elek-io/core';

export interface DefaultFieldDefinitionFormProps<T extends FieldValues>
  extends HTMLAttributes<HTMLFormElement> {
  form: UseFormReturn<T>;
  supportedLanguages: SupportedLanguage[];
  currentLanguage: SupportedLanguage;
  fieldType: FieldType;
}

const DefaultFieldDefinitionForm = ({
  form,
  currentLanguage,
  supportedLanguages,
  children,
  fieldType,
}: DefaultFieldDefinitionFormProps<FieldDefinition>): ReactElement => {
  return (
    <Fragment>
      <FormField
        control={form.control}
        name={`label.${currentLanguage}`}
        render={({ field }) => (
          <FormItem>
            <FormLabel isRequired>Label</FormLabel>
            <FormControl>
              <TranslatableFormInputField
                title="Label"
                description='The label is displayed above the input Field and should
                      indicate what the user is supposed to enter. For example
                      "Title", "Date of birth" or
                      "Summary".'
                type="text"
                field={field}
                errors={form.formState.errors}
                supportedLanguages={supportedLanguages}
              />
            </FormControl>
            <FormDescription>
              The label is displayed above the input Field and should indicate
              what the user is supposed to enter. For example &quot;Title&quot;,
              &quot;Date of birth&quot; or &quot;Summary&quot;.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`description.${currentLanguage}`}
        render={({ field }) => (
          <FormItem>
            <FormLabel isRequired>Description</FormLabel>
            <FormControl>
              <TranslatableFormTextarea
                title="Description"
                description="Describe what to input into this field. This text will be
              displayed under the field to guide users."
                field={field}
                errors={form.formState.errors}
                supportedLanguages={supportedLanguages}
              />
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
        control={form.control}
        name="inputWidth"
        render={({ field }) => (
          <FormItem>
            <FormLabel isRequired>Width</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FieldWidthSchema.options.map((option) => {
                    return (
                      <SelectItem key={option} value={option}>
                        {option} / 12
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </FormControl>
            <FormDescription>
              Defines how wide the input field will be.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {children}

      <FormField
        control={form.control}
        name="isRequired"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 p-3 shadow-xs dark:border-zinc-700">
            <div className="mr-4">
              <FormLabel isRequired>Required</FormLabel>
              <FormDescription>
                Required fields need to be filled before an Item of the
                Collection can be created or updated.{' '}
                {fieldType === 'toggle' && (
                  <>
                    <Separator className="my-2" />
                    <i>
                      Toggles are always required, since they can only be
                      checked or unchecked.
                    </i>
                  </>
                )}
              </FormDescription>
              <FormMessage />
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={fieldType === 'toggle'}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="isUnique"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 p-3 shadow-xs dark:border-zinc-700">
            <div className="mr-4">
              <FormLabel isRequired>Unique</FormLabel>
              <FormDescription>
                You won&apos;t be able to create an Entry if there is an
                existing Entry with identical content.
                {fieldType === 'toggle' && (
                  <>
                    <Separator className="my-2" />
                    <i>
                      Toggles cannot be unique, since they can only be checked
                      or unchecked.
                    </i>
                  </>
                )}
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={fieldType === 'toggle'}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="isDisabled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 p-3 shadow-xs dark:border-zinc-700">
            <div className="mr-4">
              <FormLabel isRequired>Disabled</FormLabel>
              <FormDescription>
                You won&apos;t be able to change the Value if this is active.
              </FormDescription>
              <FormMessage />
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </Fragment>
  );
};
DefaultFieldDefinitionForm.displayName = 'DefaultFieldDefinitionForm';

export { DefaultFieldDefinitionForm };
