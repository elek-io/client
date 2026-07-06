import {
  Fragment,
  useCallback,
  useEffect,
  type HTMLAttributes,
  type ReactElement,
} from 'react';
import {
  useWatch,
  type FieldPath,
  type FieldValues,
  type PathValue,
  type UseFormReturn,
} from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  TranslatableFormInputField,
  TranslatableFormTextareaField,
} from '@renderer/components/ui/form';
import { Input } from '@renderer/components/ui/input';
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
  fieldWidthSchema,
  slug,
  type FieldDefinitionBase,
  type FieldType,
  type SupportedLanguage,
} from '@elek-io/core';

// The definition-form flavor being authored. Core's 'select' fieldType is backed
// by two schemas (string and number), so the select definition form resolves the
// ambiguous 'select' to the active variant before it reaches this shared base.
export type AuthorableFieldType =
  Exclude<FieldType, 'select'> | 'stringSelect' | 'numberSelect';

export interface DefaultFieldDefinitionFormProps<
  T extends FieldValues,
> extends HTMLAttributes<HTMLFormElement> {
  form: UseFormReturn<T>;
  supportedLanguages: SupportedLanguage[];
  currentLanguage: SupportedLanguage;
  fieldType: AuthorableFieldType;
}

function DefaultFieldDefinitionForm<
  T extends FieldDefinitionBase & FieldValues,
>({
  form,
  currentLanguage,
  supportedLanguages,
  children,
  fieldType,
}: DefaultFieldDefinitionFormProps<T>): ReactElement {
  // Every FieldDefinition shares the base fields this component edits. RHF's
  // FieldPath cannot reduce those literal paths for an unresolved generic T, so
  // assert them once through this helper (the tax of staying generic).
  const base = useCallback(
    (path: string): FieldPath<T> => path as FieldPath<T>,
    []
  );
  const labelValue = useWatch({
    control: form.control,
    name: base(`label.${currentLanguage}`),
  }) as string | null | undefined;
  // Auto-generate the slug from the label until the user edits the slug manually
  useEffect(() => {
    if (form.getFieldState(base('slug')).isDirty === false) {
      form.setValue(
        base('slug'),
        slug(labelValue ?? '') as PathValue<T, FieldPath<T>>
      );
    }
  }, [form, labelValue, base]);

  return (
    <Fragment>
      <FormField
        control={form.control}
        name={base(`label.${currentLanguage}`)}
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
        name={base('slug')}
        render={({ field }) => (
          <FormItem>
            <FormLabel isRequired>Slug</FormLabel>
            <FormControl>
              <Input type="text" {...field} />
            </FormControl>
            <FormDescription>
              The technical key this Field&apos;s Values are stored under. It is
              generated from the label until edited manually.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={base(`description.${currentLanguage}`)}
        render={({ field }) => (
          <FormItem>
            <FormLabel isRequired>Description</FormLabel>
            <FormControl>
              <TranslatableFormTextareaField
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
        name={base('inputWidth')}
        render={({ field }) => (
          <FormItem>
            <FormLabel isRequired>Width</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldWidthSchema.options.map((option) => {
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
        name={base('isRequired')}
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
        name={base('isUnique')}
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
                {(fieldType === 'asset' || fieldType === 'entry') && (
                  <>
                    <Separator className="my-2" />
                    <i>Reference fields cannot be unique.</i>
                  </>
                )}
                {fieldType === 'slug' && (
                  <>
                    <Separator className="my-2" />
                    <i>
                      Slugs are always unique, so a single Entry can be
                      identified by it.
                    </i>
                  </>
                )}
                {fieldType === 'numberSelect' && (
                  <>
                    <Separator className="my-2" />
                    <i>Number select fields cannot be unique.</i>
                  </>
                )}
                {fieldType === 'markdown' && (
                  <>
                    <Separator className="my-2" />
                    <i>Markdown fields cannot be unique.</i>
                  </>
                )}
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={
                  fieldType === 'toggle' ||
                  fieldType === 'asset' ||
                  fieldType === 'entry' ||
                  fieldType === 'slug' ||
                  fieldType === 'numberSelect' ||
                  fieldType === 'markdown'
                }
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={base('isDisabled')}
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
}
DefaultFieldDefinitionForm.displayName = 'DefaultFieldDefinitionForm';

export { DefaultFieldDefinitionForm };
