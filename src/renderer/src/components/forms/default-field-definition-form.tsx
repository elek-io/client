import {
  type FieldDefinition,
  type FieldType,
  type SupportedLanguage,
} from '@elek-io/core';
import { Fragment, type HTMLAttributes, type ReactElement } from 'react';
import { type FieldValues, type UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { TranslatableFormInput } from '../ui/form-input';
import { TranslatableFormTextarea } from '../ui/form-textarea';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';

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
            <FormLabel isRequired={true}>Label</FormLabel>
            <FormControl>
              <TranslatableFormInput
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
            <FormLabel isRequired={true}>Description</FormLabel>
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

      {children}

      <FormField
        control={form.control}
        name={`isRequired`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 shadow-xs">
            <div className="mr-4">
              <FormLabel isRequired={true}>Required</FormLabel>
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
        name={`isUnique`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 shadow-xs">
            <div className="mr-4">
              <FormLabel isRequired={true}>Unique</FormLabel>
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
        name={`isDisabled`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 shadow-xs">
            <div className="mr-4">
              <FormLabel isRequired={true}>Disabled</FormLabel>
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
