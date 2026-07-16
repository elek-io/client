import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactElement } from 'react';

import { AssetDefinitionDraft } from '@renderer/components/forms/asset-field-definition';
import { EntryDefinitionDraft } from '@renderer/components/forms/entry-field-definition';
import { baseDefaults } from '@renderer/components/forms/field-definition-defaults';
import {
  DefaultValueInputField,
  DefinitionDraft,
  MinMaxRow,
  type DefinitionDraftProps,
  type DefinitionSpec,
} from '@renderer/components/forms/field-definition-draft';
import { MarkdownDefinitionDraft } from '@renderer/components/forms/markdown-field-definition';
import { SelectDefinitionDraft } from '@renderer/components/forms/select-field-definition';
import { SlugDefinitionDraft } from '@renderer/components/forms/slug-field-definition';
import {
  FormControl,
  FormDateField,
  FormDatetimeField,
  FormDescription,
  FormField,
  FormInputField,
  FormItem,
  FormLabel,
  FormMessage,
  FormTextareaField,
} from '@renderer/components/ui/form';
import { Switch } from '@renderer/components/ui/switch';

import {
  dateFieldDefinitionSchema,
  datetimeFieldDefinitionSchema,
  emailFieldDefinitionSchema,
  ipv4FieldDefinitionSchema,
  numberFieldDefinitionSchema,
  rangeFieldDefinitionSchema,
  telephoneFieldDefinitionSchema,
  textFieldDefinitionSchema,
  textareaFieldDefinitionSchema,
  timeFieldDefinitionSchema,
  toggleFieldDefinitionSchema,
  urlFieldDefinitionSchema,
  uuid,
  type DateFieldDefinition,
  type DatetimeFieldDefinition,
  type EmailFieldDefinition,
  type FieldType,
  type Ipv4FieldDefinition,
  type NumberFieldDefinition,
  type RangeFieldDefinition,
  type TelephoneFieldDefinition,
  type TextFieldDefinition,
  type TextareaFieldDefinition,
  type TimeFieldDefinition,
  type ToggleFieldDefinition,
  type UrlFieldDefinition,
} from '@elek-io/core';

// The schema-driven field-definition registry.
//
// One exhaustive table keyed on Core's FieldType: every type Core defines has an
// entry, so adding a field type to Core is a compile error here until it is
// authored. Each entry turns a runtime field type into its authoring form. The
// trivial scalar types are pure data (a spec: which Core schema validates it, a
// fresh draft, and the extra controls): text, textarea, number, toggle, email,
// date, datetime, time, url, telephone, ipv4 and range. Complex types (select,
// slug, asset, entry, markdown) live in their own file and are referenced here.
//
// 'dynamic' is the one type that cannot be authored yet. Its entry renders a
// short, non-interactive note so the Record stays exhaustive, and it is listed in
// unauthorableFieldTypes so the Add Field picker disables it.
//
// See contributing/renderer/form-architecture.md.

const textSpec: DefinitionSpec<TextFieldDefinition> = {
  authorableFieldType: 'text',
  resolver: zodResolver(textFieldDefinitionSchema),
  makeDefaults: (langs) => ({
    ...baseDefaults(langs),
    id: uuid(),
    valueType: 'string',
    fieldType: 'text',
    defaultValue: null,
    min: null,
    max: 250,
  }),
  Extras: ({ form }) => (
    <>
      <DefaultValueInputField form={form} name="defaultValue" type="text" />
      <MinMaxRow
        form={form}
        minName="min"
        maxName="max"
        unit="number of characters the user can enter"
      />
    </>
  ),
};

const textareaSpec: DefinitionSpec<TextareaFieldDefinition> = {
  authorableFieldType: 'textarea',
  resolver: zodResolver(textareaFieldDefinitionSchema),
  makeDefaults: (langs) => ({
    ...baseDefaults(langs),
    id: uuid(),
    valueType: 'string',
    fieldType: 'textarea',
    defaultValue: null,
    min: null,
    max: null,
  }),
  Extras: ({ form }) => (
    <>
      <FormField
        control={form.control}
        name="defaultValue"
        render={({ field }) => (
          <FormItem>
            <FormLabel isRequired={false}>Default value</FormLabel>
            <FormControl>
              <FormTextareaField field={field} />
            </FormControl>
            <FormDescription>The initial value for the field.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <MinMaxRow
        form={form}
        minName="min"
        maxName="max"
        unit="number of characters the user can enter"
      />
    </>
  ),
};

const numberSpec: DefinitionSpec<NumberFieldDefinition> = {
  authorableFieldType: 'number',
  resolver: zodResolver(numberFieldDefinitionSchema),
  makeDefaults: (langs) => ({
    ...baseDefaults(langs),
    id: uuid(),
    valueType: 'number',
    fieldType: 'number',
    defaultValue: null,
    min: null,
    max: null,
    isUnique: false,
  }),
  Extras: ({ form }) => (
    <>
      <FormField
        control={form.control}
        name="defaultValue"
        render={({ field }) => (
          <FormItem>
            <FormLabel isRequired={false}>Default value</FormLabel>
            <FormControl>
              <FormInputField field={field} type="number" />
            </FormControl>
            <FormDescription>The initial value for the field.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <MinMaxRow
        form={form}
        minName="min"
        maxName="max"
        unit="value the user can enter"
      />
    </>
  ),
};

const toggleSpec: DefinitionSpec<ToggleFieldDefinition> = {
  authorableFieldType: 'toggle',
  resolver: zodResolver(toggleFieldDefinitionSchema),
  makeDefaults: (langs) => ({
    ...baseDefaults(langs),
    id: uuid(),
    valueType: 'boolean',
    fieldType: 'toggle',
    defaultValue: false,
    isRequired: true,
    isUnique: false,
  }),
  Extras: ({ form }) => (
    <FormField
      control={form.control}
      name="defaultValue"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 p-3 shadow-xs dark:border-zinc-800">
          <div>
            <FormLabel isRequired>Default value</FormLabel>
            <FormDescription>The initial value for the field.</FormDescription>
            <FormMessage />
          </div>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  ),
};

const emailSpec: DefinitionSpec<EmailFieldDefinition> = {
  authorableFieldType: 'email',
  resolver: zodResolver(emailFieldDefinitionSchema),
  makeDefaults: (langs) => ({
    ...baseDefaults(langs),
    id: uuid(),
    valueType: 'string',
    fieldType: 'email',
    defaultValue: null,
  }),
  Extras: ({ form }) => (
    <DefaultValueInputField form={form} name="defaultValue" type="email" />
  ),
};

const dateSpec: DefinitionSpec<DateFieldDefinition> = {
  authorableFieldType: 'date',
  resolver: zodResolver(dateFieldDefinitionSchema),
  makeDefaults: (langs) => ({
    ...baseDefaults(langs),
    id: uuid(),
    valueType: 'string',
    fieldType: 'date',
    defaultValue: null,
  }),
  // Dates use the bespoke date picker, not a FormInputField, so this stays inline
  // rather than routing through DefaultValueInputField.
  Extras: ({ form }) => (
    <FormField
      control={form.control}
      name="defaultValue"
      render={({ field }) => (
        <FormItem>
          <FormLabel isRequired={false}>Default value</FormLabel>
          <FormControl>
            <FormDateField field={field} />
          </FormControl>
          <FormDescription>The initial value for the field.</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  ),
};

const datetimeSpec: DefinitionSpec<DatetimeFieldDefinition> = {
  authorableFieldType: 'datetime',
  resolver: zodResolver(datetimeFieldDefinitionSchema),
  makeDefaults: (langs) => ({
    ...baseDefaults(langs),
    id: uuid(),
    valueType: 'string',
    fieldType: 'datetime',
    defaultValue: null,
  }),
  // Like date, the datetime picker is bespoke; its description also calls out the
  // local-time display and UTC storage, so it stays inline.
  Extras: ({ form }) => (
    <FormField
      control={form.control}
      name="defaultValue"
      render={({ field }) => (
        <FormItem>
          <FormLabel isRequired={false}>Default value</FormLabel>
          <FormControl>
            <FormDatetimeField field={field} />
          </FormControl>
          <FormDescription>
            The initial value for the field. It is shown in your local time and
            stored as UTC.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  ),
};

const timeSpec: DefinitionSpec<TimeFieldDefinition> = {
  authorableFieldType: 'time',
  resolver: zodResolver(timeFieldDefinitionSchema),
  makeDefaults: (langs) => ({
    ...baseDefaults(langs),
    id: uuid(),
    valueType: 'string',
    fieldType: 'time',
    defaultValue: null,
  }),
  Extras: ({ form }) => (
    <DefaultValueInputField form={form} name="defaultValue" type="time" />
  ),
};

const urlSpec: DefinitionSpec<UrlFieldDefinition> = {
  authorableFieldType: 'url',
  resolver: zodResolver(urlFieldDefinitionSchema),
  makeDefaults: (langs) => ({
    ...baseDefaults(langs),
    id: uuid(),
    valueType: 'string',
    fieldType: 'url',
    defaultValue: null,
  }),
  Extras: ({ form }) => (
    <DefaultValueInputField form={form} name="defaultValue" type="url" />
  ),
};

const telephoneSpec: DefinitionSpec<TelephoneFieldDefinition> = {
  authorableFieldType: 'telephone',
  resolver: zodResolver(telephoneFieldDefinitionSchema),
  makeDefaults: (langs) => ({
    ...baseDefaults(langs),
    id: uuid(),
    valueType: 'string',
    fieldType: 'telephone',
    defaultValue: null,
  }),
  Extras: ({ form }) => (
    <DefaultValueInputField form={form} name="defaultValue" type="telephone" />
  ),
};

const ipv4Spec: DefinitionSpec<Ipv4FieldDefinition> = {
  authorableFieldType: 'ipv4',
  resolver: zodResolver(ipv4FieldDefinitionSchema),
  makeDefaults: (langs) => ({
    ...baseDefaults(langs),
    id: uuid(),
    valueType: 'string',
    fieldType: 'ipv4',
    defaultValue: null,
  }),
  Extras: ({ form }) => (
    <DefaultValueInputField
      form={form}
      name="defaultValue"
      type="ipv4"
      placeholder="192.168.1.1"
    />
  ),
};

const rangeSpec: DefinitionSpec<RangeFieldDefinition> = {
  authorableFieldType: 'range',
  resolver: zodResolver(rangeFieldDefinitionSchema),
  // Range is the odd scalar: it is always required and its default, min and max
  // are mandatory numbers (not nullable). baseDefaults already sets isRequired
  // true and isUnique false, but both are re-narrowed here to Core's literals.
  makeDefaults: (langs) => ({
    ...baseDefaults(langs),
    id: uuid(),
    valueType: 'number',
    fieldType: 'range',
    defaultValue: 50,
    min: 0,
    max: 100,
    isRequired: true,
    isUnique: false,
  }),
  Extras: ({ form }) => (
    <>
      <DefaultValueInputField
        form={form}
        name="defaultValue"
        type="number"
        isRequired
      />
      <MinMaxRow
        form={form}
        minName="min"
        maxName="max"
        unit="Value the user is able to enter"
        isRequired
      />
    </>
  ),
};

/**
 * Field types Core defines but that cannot be authored yet. They still get a
 * registry entry (a short note) so the Record stays exhaustive, but the Add Field
 * picker disables them. This sits beside the registry so the two facts about an
 * unauthorable type - its entry and its disabled state - stay together.
 */
export const unauthorableFieldTypes: ReadonlySet<FieldType> = new Set([
  'dynamic',
]);

/**
 * The registry: field type to authoring form. Exhaustive over Core's FieldType,
 * so adding a field type to Core fails to compile here until it has an entry.
 */
export const FIELD_DEFINITION_REGISTRY: Record<
  FieldType,
  (props: DefinitionDraftProps) => ReactElement
> = {
  text: (props) => <DefinitionDraft {...props} spec={textSpec} />,
  textarea: (props) => <DefinitionDraft {...props} spec={textareaSpec} />,
  number: (props) => <DefinitionDraft {...props} spec={numberSpec} />,
  toggle: (props) => <DefinitionDraft {...props} spec={toggleSpec} />,
  email: (props) => <DefinitionDraft {...props} spec={emailSpec} />,
  date: (props) => <DefinitionDraft {...props} spec={dateSpec} />,
  datetime: (props) => <DefinitionDraft {...props} spec={datetimeSpec} />,
  time: (props) => <DefinitionDraft {...props} spec={timeSpec} />,
  url: (props) => <DefinitionDraft {...props} spec={urlSpec} />,
  telephone: (props) => <DefinitionDraft {...props} spec={telephoneSpec} />,
  ipv4: (props) => <DefinitionDraft {...props} spec={ipv4Spec} />,
  range: (props) => <DefinitionDraft {...props} spec={rangeSpec} />,
  select: (props) => <SelectDefinitionDraft {...props} />,
  slug: (props) => <SlugDefinitionDraft {...props} />,
  asset: (props) => <AssetDefinitionDraft {...props} />,
  entry: (props) => <EntryDefinitionDraft {...props} />,
  markdown: (props) => <MarkdownDefinitionDraft {...props} />,
  // 'dynamic' cannot be authored yet; this note keeps the Record exhaustive. It
  // is unreachable through the picker, which disables it via
  // unauthorableFieldTypes.
  dynamic: () => (
    <div className="rounded-md border border-dashed border-zinc-300 p-3 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
      This field type can&apos;t be authored yet.
    </div>
  ),
};
