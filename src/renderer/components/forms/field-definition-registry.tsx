import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactElement } from 'react';

import { baseDefaults } from '@renderer/components/forms/field-definition-defaults';
import {
  DefaultValueTextField,
  DefinitionDraft,
  MinMaxRow,
  type DefinitionDraftProps,
  type DefinitionSpec,
} from '@renderer/components/forms/field-definition-draft';
import { SelectDefinitionDraft } from '@renderer/components/forms/select-field-definition';
import {
  FormControl,
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
  emailFieldDefinitionSchema,
  numberFieldDefinitionSchema,
  textFieldDefinitionSchema,
  textareaFieldDefinitionSchema,
  toggleFieldDefinitionSchema,
  uuid,
  type EmailFieldDefinition,
  type FieldType,
  type NumberFieldDefinition,
  type TextFieldDefinition,
  type TextareaFieldDefinition,
  type ToggleFieldDefinition,
} from '@elek-io/core';

// PROOF OF CONCEPT - the schema-driven field-definition registry.
//
// One table keyed on Core's FieldType. Each entry turns a runtime field type
// into its authoring form. The trivial scalar types are pure data (a spec: which
// Core schema validates it, a fresh draft, and the extra controls). Complex
// types (select, and later slug/asset/entry/markdown) live in their own file and
// are referenced here.
//
// The Add Field sheet falls back to the existing dispatcher for types not
// registered here, so the app stays fully functional while the strangler
// migration proceeds.
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
      <DefaultValueTextField form={form} name="defaultValue" />
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
    <DefaultValueTextField form={form} name="defaultValue" />
  ),
};

/**
 * The registry: field type to authoring form. A `Record<FieldType, ...>` here
 * would make Core adding a field type a compile error; the PoC uses a Partial
 * because it only migrates a representative subset.
 */
export const FIELD_DEFINITION_REGISTRY: Partial<
  Record<FieldType, (props: DefinitionDraftProps) => ReactElement>
> = {
  text: (props) => <DefinitionDraft {...props} spec={textSpec} />,
  textarea: (props) => <DefinitionDraft {...props} spec={textareaSpec} />,
  number: (props) => <DefinitionDraft {...props} spec={numberSpec} />,
  toggle: (props) => <DefinitionDraft {...props} spec={toggleSpec} />,
  email: (props) => <DefinitionDraft {...props} spec={emailSpec} />,
  select: (props) => <SelectDefinitionDraft {...props} />,
};

export function isRegisteredFieldType(fieldType: FieldType): boolean {
  return fieldType in FIELD_DEFINITION_REGISTRY;
}
