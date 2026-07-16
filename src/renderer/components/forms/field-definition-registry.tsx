import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactElement } from 'react';
import {
  useForm,
  type DefaultValues,
  type FieldPath,
  type FieldValues,
  type Resolver,
  type UseFormReturn,
} from 'react-hook-form';

import { DefaultFieldDefinitionForm } from '@renderer/components/forms/default-field-definition-form';
import { AppForm } from '@renderer/components/ui/app-form';
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
import { translatableDefault } from '@renderer/lib/utils';

import {
  emailFieldDefinitionSchema,
  numberFieldDefinitionSchema,
  textFieldDefinitionSchema,
  textareaFieldDefinitionSchema,
  toggleFieldDefinitionSchema,
  uuid,
  type EmailFieldDefinition,
  type FieldDefinition,
  type FieldDefinitionBase,
  type FieldType,
  type NumberFieldDefinition,
  type SupportedLanguage,
  type TextFieldDefinition,
  type TextareaFieldDefinition,
  type ToggleFieldDefinition,
} from '@elek-io/core';

// PROOF OF CONCEPT - the schema-driven field-definition registry.
//
// One table keyed on Core's FieldType. Each entry knows the Core schema that
// validates the definition, the defaults for a fresh draft, and the type
// specific controls beyond the shared base. Adding these types back as data
// replaces one per-type file, one useForm instance and two switch cases each.
//
// This PoC registers a representative set of the "trivial" scalar types (the
// inventory found 13 of 17 per-type files contain zero logic). The Add Field
// sheet falls back to the existing dispatcher for types not registered here, so
// the app stays fully functional while the strangler migration proceeds.
//
// See contributing/renderer/form-architecture.md.

/**
 * The fields every field definition shares before its type specific extras.
 * Centralised here so the per-type defaults below stay a one-liner of deltas.
 */
function baseDefaults(
  supportedLanguages: SupportedLanguage[]
): Omit<FieldDefinitionBase, 'id'> {
  return {
    slug: '',
    label: translatableDefault({ supportedLanguages, defaultValue: '' }),
    description: translatableDefault({ supportedLanguages, defaultValue: '' }),
    isRequired: true,
    isDisabled: false,
    isUnique: false,
    inputWidth: '12',
  };
}

// Shared authoring controls. They are generic over the concrete definition type
// and take the field name as an already-typed FieldPath, so each call site (a
// concrete spec) passes a real key with no cast. This is the value-typed field
// contract the design doc describes, applied to the authoring forms.

/** A "Default value" control with a plain text input. */
function DefaultValueTextField<Def extends FieldValues>({
  form,
  name,
}: {
  form: UseFormReturn<Def>;
  name: FieldPath<Def>;
}): ReactElement {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel isRequired={false}>Default value</FormLabel>
          <FormControl>
            <FormInputField field={field} type="text" />
          </FormControl>
          <FormDescription>The initial value for the field.</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** A "Minimum" / "Maximum" pair bound to numeric inputs. Shared by the string
 * length and number bound field types, differing only in the copy. */
function MinMaxRow<Def extends FieldValues>({
  form,
  minName,
  maxName,
  unit,
}: {
  form: UseFormReturn<Def>;
  minName: FieldPath<Def>;
  maxName: FieldPath<Def>;
  unit: string;
}): ReactElement {
  return (
    <div className="flex flex-row items-center justify-between space-x-2">
      <FormField
        control={form.control}
        name={minName}
        render={({ field }) => (
          <FormItem>
            <FormLabel isRequired={false}>Minimum</FormLabel>
            <FormControl>
              <FormInputField field={field} type="number" />
            </FormControl>
            <FormDescription>The minimum {unit}.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={maxName}
        render={({ field }) => (
          <FormItem>
            <FormLabel isRequired={false}>Maximum</FormLabel>
            <FormControl>
              <FormInputField field={field} type="number" />
            </FormControl>
            <FormDescription>The maximum {unit}.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

/**
 * One field type's authoring contract: which Core schema validates it, a fresh
 * draft, and the extra controls beyond the shared base. Each spec binds its own
 * concrete definition type, so the field paths inside `Extras` resolve without
 * the `as FieldPath<T>` casts the generic base form needs.
 */
interface DefinitionSpec<Def extends FieldDefinitionBase> {
  authorableFieldType: 'text' | 'textarea' | 'number' | 'toggle' | 'email';
  // Built with zodResolver where Def is concrete, so the resolver's output type
  // is bound to Def. The generic DefinitionDraft below then needs no cast.
  resolver: Resolver<Def>;
  makeDefaults: (supportedLanguages: SupportedLanguage[]) => Def;
  Extras?: (props: { form: UseFormReturn<Def> }) => ReactElement;
}

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

export interface DefinitionDraftProps {
  id: string;
  existingSlugs: string[];
  supportedLanguages: SupportedLanguage[];
  defaultLanguage: SupportedLanguage;
  onAdd: (definition: FieldDefinition) => void;
}

/**
 * One authoring form, driven by a single spec. Replaces the per-type
 * `*-value-definition-form.tsx` wrapper and its dedicated useForm instance. It
 * is a real AppForm: submission is native through a detached SubmitButton, not
 * an imperative ref, so the Add Field sheet uses the one submission model.
 */
function DefinitionDraft<Def extends FieldDefinition & FieldDefinitionBase>({
  spec,
  id,
  existingSlugs,
  supportedLanguages,
  defaultLanguage,
  onAdd,
}: DefinitionDraftProps & { spec: DefinitionSpec<Def> }): ReactElement {
  const form = useForm<Def, unknown, Def>({
    resolver: spec.resolver,
    // makeDefaults returns a full Def; DefaultValues<Def> is its DeepPartial. RHF
    // cannot prove the subtype for an unresolved generic Def, so this is asserted
    // once here - the same tax the old code paid per type, now in one place.
    defaultValues: spec.makeDefaults(supportedLanguages) as DefaultValues<Def>,
  });

  const onSubmit = (definition: Def): void => {
    // Core rejects duplicate slugs when the Collection is saved, so surface it
    // here where the user can still fix it. Core also exports
    // fieldDefinitionSlugUniquenessSuperRefinement for the whole-collection
    // check; this in-sheet guard is the fast, per-add version.
    if (existingSlugs.includes(definition.slug)) {
      form.setError('slug' as FieldPath<Def>, {
        type: 'duplicate',
        message: `A Field with the slug "${definition.slug}" already exists`,
      });
      return;
    }
    onAdd(definition);
  };

  const Extras = spec.Extras;

  return (
    <AppForm id={id} form={form} onSubmit={onSubmit}>
      <DefaultFieldDefinitionForm
        form={form}
        fieldType={spec.authorableFieldType}
        currentLanguage={defaultLanguage}
        supportedLanguages={supportedLanguages}
      >
        {Extras ? <Extras form={form} /> : null}
      </DefaultFieldDefinitionForm>
    </AppForm>
  );
}

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
};

export function isRegisteredFieldType(fieldType: FieldType): boolean {
  return fieldType in FIELD_DEFINITION_REGISTRY;
}
