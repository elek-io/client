import { type ReactElement } from 'react';
import {
  useForm,
  type DefaultValues,
  type FieldPath,
  type FieldValues,
  type Resolver,
  type UseFormReturn,
} from 'react-hook-form';

import {
  DefaultFieldDefinitionForm,
  type AuthorableFieldType,
} from '@renderer/components/forms/default-field-definition-form';
import { AppForm } from '@renderer/components/ui/app-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormInputField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@renderer/components/ui/form';

import {
  type FieldDefinition,
  type FieldDefinitionBase,
  type FieldType,
  type SupportedLanguage,
} from '@elek-io/core';

// PROOF OF CONCEPT - the shared engine every field-definition authoring form
// uses. A per-type "spec" (which Core schema validates it, a fresh draft, and
// the extra controls) plus one generic DefinitionDraft that turns a spec into a
// real AppForm. Per-type files (scalars, select, ...) only provide specs. The
// shared draft defaults live in field-definition-defaults.ts.
//
// See contributing/renderer/form-architecture.md.

// Shared authoring controls. They are generic over the concrete definition type
// and take the field name as an already-typed FieldPath, so each call site (a
// concrete spec) passes a real key with no cast. This is the value-typed field
// contract the design doc describes, applied to the authoring forms.

/** A "Default value" control backed by FormInputField, parameterized by the Core
 * field type. FormInputField maps that to a valid HTML input type internally
 * (telephone -> tel, ipv4 -> text, datetime -> datetime-local), so callers pass
 * the Core field type rather than hand-rolling an HTML one. Shared by every
 * string and number scalar whose only delta is the input type. */
export function DefaultValueInputField<Def extends FieldValues>({
  form,
  name,
  type,
  isRequired = false,
  description = 'The initial value for the field.',
  placeholder,
}: {
  form: UseFormReturn<Def>;
  name: FieldPath<Def>;
  type: FieldType;
  isRequired?: boolean;
  description?: string;
  placeholder?: string;
}): ReactElement {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel isRequired={isRequired}>Default value</FormLabel>
          <FormControl>
            <FormInputField
              field={field}
              type={type}
              placeholder={placeholder}
            />
          </FormControl>
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** A "Minimum" / "Maximum" pair bound to numeric inputs. Shared by the string
 * length and number bound field types, differing only in the copy. `isRequired`
 * flips the labels between the optional bounds (text, number) and the required
 * ones (range, whose min and max are mandatory numbers). */
export function MinMaxRow<Def extends FieldValues>({
  form,
  minName,
  maxName,
  unit,
  isRequired = false,
}: {
  form: UseFormReturn<Def>;
  minName: FieldPath<Def>;
  maxName: FieldPath<Def>;
  unit: string;
  isRequired?: boolean;
}): ReactElement {
  return (
    <div className="flex flex-row items-center justify-between space-x-2">
      <FormField
        control={form.control}
        name={minName}
        render={({ field }) => (
          <FormItem>
            <FormLabel isRequired={isRequired}>Minimum</FormLabel>
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
            <FormLabel isRequired={isRequired}>Maximum</FormLabel>
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

/** The context a type's `Extras` receives. Scalars use only `form`; translatable
 * sub-fields (a select field's option labels) also need the languages. */
export interface DefinitionExtrasProps<Def extends FieldValues> {
  form: UseFormReturn<Def>;
  currentLanguage: SupportedLanguage;
  supportedLanguages: SupportedLanguage[];
}

/**
 * One field type's authoring contract: which Core schema validates the
 * definition, a fresh draft, and the extra controls beyond the shared base. Each
 * spec binds its own concrete definition type, so the field paths inside `Extras`
 * resolve without the `as FieldPath<T>` casts the generic base form needs.
 */
export interface DefinitionSpec<Def extends FieldDefinitionBase> {
  authorableFieldType: AuthorableFieldType;
  // Built with zodResolver where Def is concrete, so the resolver's output type
  // is bound to Def. The generic DefinitionDraft below then needs no cast.
  resolver: Resolver<Def>;
  makeDefaults: (supportedLanguages: SupportedLanguage[]) => Def;
  Extras?: (props: DefinitionExtrasProps<Def>) => ReactElement;
}

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
export function DefinitionDraft<
  Def extends FieldDefinition & FieldDefinitionBase,
>({
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
        {Extras ? (
          <Extras
            form={form}
            currentLanguage={defaultLanguage}
            supportedLanguages={supportedLanguages}
          />
        ) : null}
      </DefaultFieldDefinitionForm>
    </AppForm>
  );
}
