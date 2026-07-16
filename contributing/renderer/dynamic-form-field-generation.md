# Dynamic Form Field Generation

## Overview

Static forms with predefined fields are straightforward to implement. However, elek.io allows users to define their own content structures through Collections, which means forms must be generated dynamically based on user-defined schemas.

**Why Dynamic Forms?**

Users need the flexibility to create custom content types without modifying code. For example:

- A blog might need: title (text), content (textarea), published (boolean)
- A product catalog might need: name (text), price (number), inStock (boolean), images (file)
- An event calendar might need: title (text), date (date), location (text)

We can't hardcode these forms since they are user-defined, instead we use **field definitions** to describe each field's properties, allowing the UI to render appropriate form controls dynamically.

## Field Definitions

A field definition is a JSON object that contains all necessary information to render and validate a form field.

**Example field definition for a blog post title:**

```typescript
{
  id: '467e57ea-e04a-44a7-b34b-684ed3ba6f49',
  slug: 'title',              // Unique key used as the field's name in an Entry
  valueType: 'string',        // Data type for validation
  fieldType: 'text',          // UI component to render
  label: {                    // Label with translations
    en: 'Title',
    de: 'Titel',
  },
  description: {              // Description with translations
    en: 'A short title for the Entry',
    de: 'Ein kurzer Titel für den Eintrag',
  },
  min: null,                  // Min length (text) or numeric bound (number/range)
  max: 100,                   // Max length or numeric bound
  defaultValue: null,         // Default value when creating a new Entry
  inputWidth: '12',           // Grid column width, one of '3' | '4' | '6' | '12'
  isDisabled: false,          // Whether field is read-only
  isRequired: true,           // Whether field must be filled
  isUnique: false,            // Whether value must be unique across Entries
}
```

**Key Properties:**

Depending on the field type, definitions may include different properties, but common ones are:

- `id`: Unique identifier for this field
- `slug`: Unique, machine-readable key used as the field's name within an Entry
- `valueType`: The underlying data type (`string`, `number`, `boolean`, `reference`, etc.) - used for validation
- `fieldType`: The UI component type (`text`, `textarea`, `number`, `toggle`, `date`, `asset`, etc.)
- `label` / `description`: Translatable strings for multiple languages that help users understand the field's purpose
- `min` / `max`: Validation constraints (character length for text fields, numeric bounds for `number` and `range` fields)
- `isRequired`: Whether the field must have a value
- `inputWidth`: Grid column width, one of `'3'`, `'4'`, `'6'` or `'12'` (a 12-column grid)

## Field definition groups

A Collection's `fieldDefinitions` is a `FieldDefinitionOrGroup[]`. Besides plain field definitions it can contain presentational **groups**: `{ isGroup: true, label, description, fieldDefinitions }`, where the nested `fieldDefinitions` is a flat list of member field definitions (groups do not nest).

Groups are rendered, not authored, in the client today. Wherever field definitions are shown to a user (the entry form and the collection editor) a group is rendered as a labeled `FieldSet` ([`components/ui/field.tsx`](../../src/renderer/components/ui/field.tsx)) that wraps its members. Narrow the union with `'isGroup' in fieldDefinition`.

Where grouping carries no meaning - generating an Entry's Zod schema, the create-Entry defaults, and the Entry table columns - flatten the union first with Core's `flattenFieldDefinitions(fieldDefinitions)`, which drops the groups and hoists their members into a flat `FieldDefinition[]`.

## Creating Field Definitions via a Collection

When users create or update a Collection, they use a visual editor to define the fields for that Collection type.

**Location:** Collection forms are in [`components/forms/collection-form.tsx`](../../src/renderer/components/forms/collection-form.tsx) and used in routes like [`routes/projects/$projectId/collections/create.tsx`](../../src/renderer/routes/projects/$projectId/collections/create.tsx) and [`routes/projects/$projectId/collections/$collectionId/update.tsx`](../../src/renderer/routes/projects/$projectId/collections/$collectionId/update.tsx)

**Features:**

- Add, remove, and reorder fields via drag-and-drop
- Select field type (text, textarea, number, toggle, date, asset, entry, etc.)
- Set labels and descriptions with multi-language support
- Configure validation rules (min/max length, required, unique)
- Set default values and input width
- Preview how the form will look to content editors

### Field Definition Form Architecture

Field-definition authoring is driven by a **registry** keyed on Core's `FieldType`, not a per-type form file plus a central dispatcher. One `AppForm` is mounted for the field type being added, and submission is native through a detached `SubmitButton` (`form={id}`), not an imperative ref. The pieces:

- **`FIELD_DEFINITION_REGISTRY`** ([`forms/field-definition-registry.tsx`](../../src/renderer/components/forms/field-definition-registry.tsx)) is the table: an exhaustive `Record<FieldType, (props) => ReactElement>`. Because it is exhaustive, adding a field type to Core is a compile error here until it has an entry. The trivial scalar types (`text`, `textarea`, `number`, `toggle`, `email`, `date`, `datetime`, `time`, `url`, `telephone`, `ipv4`, `range`) are pure data: each is a `DefinitionSpec` (the Core schema that validates it, a fresh draft via `makeDefaults`, and an optional `Extras` for the type-specific controls) rendered through the shared `DefinitionDraft`. The complex types (`select`, `slug`, `asset`, `entry`, `markdown`) live in their own `<type>-field-definition.tsx` file, referenced from the table. `dynamic` cannot be authored yet: its entry renders a short note, and it is listed in `unauthorableFieldTypes` next to the registry, which is what the picker uses to disable it.
- **`DefinitionDraft`** ([`forms/field-definition-draft.tsx`](../../src/renderer/components/forms/field-definition-draft.tsx)) is the shared engine. Given a `DefinitionSpec` it builds one real `AppForm`: it calls `useForm()` with the spec's resolver and defaults, rejects duplicate slugs, wraps `DefaultFieldDefinitionForm`, and renders the spec's `Extras` as children. This replaces the per-type wrapper file and its dedicated `useForm` instance, so there is one live form, remounted when the picker changes type, not 18 always-mounted ones. Its value-typed helpers (`DefaultValueInputField`, `MinMaxRow`) let a spec's `Extras` compose the common controls without a bespoke file.
- **`DefaultFieldDefinitionForm`** ([`forms/default-field-definition-form.tsx`](../../src/renderer/components/forms/default-field-definition-form.tsx)) renders the fields every definition shares (label, slug, description, `inputWidth`, `isRequired`, `isUnique`, `isDisabled`) and takes the type-specific inputs as `children`. It also auto-generates the slug from the label until the user edits the slug manually.

One field type is special: Core backs `select` with two schemas, one for text options and one for number options. The select authoring file ([`select-field-definition.tsx`](../../src/renderer/components/forms/select-field-definition.tsx)) holds a `DefinitionSpec` for each variant (`stringSelect` / `numberSelect`) and a value-type picker that mounts the matching one. The shared base form receives the resolved variant as its `fieldType`, which is why that prop is the widened `AuthorableFieldType` instead of Core's `FieldType`.

The **Add Field sheet** ([`forms/add-field-sheet.tsx`](../../src/renderer/components/forms/add-field-sheet.tsx)) renders the field-type picker, looks the selected type up in the registry, renders that one entry in its body, and submits it with a single detached `SubmitButton` in its footer. `CollectionForm` ([`forms/collection-form.tsx`](../../src/renderer/components/forms/collection-form.tsx)) embeds `<AddFieldSheet>` and receives each new definition through an `onAppend` callback.

> [!NOTE]
> The type `Select` lists every Core `fieldType`. To add authoring for a new one, add a `DefinitionSpec` (and, for a complex type, a `<type>-field-definition.tsx` file), register it in `FIELD_DEFINITION_REGISTRY`, and remove it from `unauthorableFieldTypes`. The `Record<FieldType, ...>` type makes this non-optional: the registry does not compile until the new type has an entry. Confirm Core's `fieldTypeSchema` includes it.

## Rendering Dynamic Forms

When rendering a form to create or edit an Entry, we iterate over the Collection's field definitions and render appropriate form controls for each field.

**Location:** Entry forms are in [`components/forms/entry-form.tsx`](../../src/renderer/components/forms/entry-form.tsx) and used in routes like [`routes/projects/$projectId/collections/$collectionId/create.tsx`](../../src/renderer/routes/projects/$projectId/collections/$collectionId/create.tsx) and [`routes/projects/$projectId/collections/$collectionId/$entryId/update.tsx`](../../src/renderer/routes/projects/$projectId/collections/$collectionId/$entryId/update.tsx)

### Component Architecture

The dynamic form rendering system is built with layered components, each adding functionality:

#### Base UI Components

Located in [`components/ui/`](../../src/renderer/components/ui/):

- **`Input`**, **`Textarea`**, **`Switch`**, **`Slider`**, **`Select`**: basic form controls with styling and [Radix UI primitives](https://www.radix-ui.com/primitives) for accessibility
- These are the fundamental building blocks used across the application

#### Typed field wrappers

Also in [`components/ui/form.tsx`](../../src/renderer/components/ui/form.tsx): a layer of reusable wrappers that bind a base control to React Hook Form and own value transformation - `FormInputField`, `FormTextareaField`, `FormDateField`, `FormDatetimeField`, `FormSelectField`, `FormRangeField`, `FormToggleField`, `FormAssetField`, `FormEntryField`. `TranslatableFormInputField` / `TranslatableFormTextareaField` are thin presets over the shared `TranslatableField` (see below) for the static string / textarea cases.

These wrappers carry the value contract Core expects, so do not hand-roll a raw `<Input>`:

- They return `null` for empty values instead of empty strings (Core schemas use `.nullable()`, so `''` would fail validation)
- `FormInputField` with `type="number"` coerces the string input to a number
- `FormInputField` maps field types without an HTML input type of the same name (`telephone` to `tel`, `ipv4` and `slug` to `text`, `datetime` to `datetime-local`)
- `FormDatetimeField` converts between the ISO UTC datetime Core stores and the local time the `datetime-local` input speaks
- `FormSlugField` derives the slug live from its source fields (same language) while the value is empty or still equals the last derived value, so a stored slug is never rewritten. Manual input is made canonical on blur. It resolves its source ids through `useFieldDefinitions()` ([`hooks/useFieldDefinitions.ts`](../../src/renderer/hooks/useFieldDefinitions.ts)), provided by the `FieldDefinitionsProvider` ([`providers/FieldDefinitionsProvider.tsx`](../../src/renderer/providers/FieldDefinitionsProvider.tsx)) that `EntryForm` wraps its fields in - outside of it (for example the Collection editor preview) the input is simply manual
- `markdown` fields render the Milkdown based `MarkdownEditor` through a thin adapter - see [`markdown-editor.md`](./markdown-editor.md)

The leaf wrappers are **value-typed**: they receive the already-bound `field` (value/onChange/onBlur/ref) plus a `controlProps` bag (`id`, `aria-describedby`, `aria-invalid`) to place on the real input. They do not know or build a form path (the path lives at the single `Controller` in `FormFieldFromDefinition`). Each wrapper places `controlProps` on its actual focusable control - the `<input>` for the scalars, the `SelectTrigger` for select, the dialog trigger button for asset / entry, the wrapper for markdown - so the `<label htmlFor>`, description and error association always point at a focusable element.

#### The render registry

Rendering is driven by a **registry** keyed on Core's `FieldType`, the RENDER facet that shares the `FieldType` spine with the authoring `FIELD_DEFINITION_REGISTRY`. It replaced the old 18-case switch, the hand-synced `renderableFieldTypes` set, and the three near-identical translatable wrappers. Everything below lives in [`components/ui/form.tsx`](../../src/renderer/components/ui/form.tsx).

- **`RENDER_REGISTRY`** is an exhaustive `Record<FieldType, RenderSpec>`. Because it is exhaustive, adding a field type to Core is a compile error here until it has an entry. Each `RenderSpec` has:
  - `renderInput(props)` - the value-typed leaf described above. It receives `{ field, fieldDefinition, disabled, controlProps }` and renders the matching typed wrapper.
  - `translatable` - whether the Value is per-language. Core stores every value type except `component` as a per-language record (see Core's `docs/fields.md`), so every rendered type is translatable; only the `dynamic` placeholder is not.

  The `dynamic` entry keeps the record exhaustive and draws the muted "can't be displayed yet" placeholder so a Collection carrying an unsupported type (via Core, the API, or a migration) does not crash (see [`not-yet-implemented.md`](../not-yet-implemented.md)).

- **`FormComponentFromFieldDefinition`** (internal) is now a one-line `RENDER_REGISTRY[fieldType].renderInput(...)` lookup.

- **The registry emits no native constraint attributes.** zod (through react-hook-form) is the only validator and the form is `noValidate`, so the leaves never set `required` / `min` / `max` / `minLength` / `maxLength`. The one exception is the range `Slider`'s `min` / `max`, which are its functional value domain, not HTML constraints. A test asserts a required field renders with no `required` attribute.

- **`ControlledLeaf`** (internal) reads the surrounding `FormItem` / `FormField` ids through `useFormField` and hands them to the leaf as `controlProps`, so `id` and `aria-*` land on the real focusable input **by construction**. This replaced wrapping the leaf in a `<FormControl>` Radix `Slot`, which could only reach the leaf's outermost element - a wrapper `<div>` or a non-DOM Radix root for select and reference fields.

- **`TranslatableField`** (internal) is the single per-language wrapper. With one Project language it renders the leaf directly; with more it renders the leaf plus a dialog that edits every supported language. It owns the multi-field name convention (the name's last dot-segment is the language, so the sibling paths derive from it) and the `hasErrorsInTranslations` traversal that flags the dialog trigger when a hidden translation is invalid.

- **`FormFieldFromDefinition`** (exported, the entry point) owns the single `FormField` / `Controller` at `name` and composes the label (with required indicator), the registry leaf (through `TranslatableField` when translatable), the description and the validation message. Use it when rendering an Entry's fields.

- **`FormFieldDefinitionPreview`** (exported) is the collection editor's non-editable preview. It draws the same label / leaf / description plus the drag / edit / delete chrome, but is **not** bound to a form: the leaf holds a static, disabled Value, so there are no phantom form paths and the label associates with a real (disabled) input (so the previews are addressable by `getByLabel`).

### Example Usage

```typescript
import { FormFieldFromDefinition } from '@renderer/components/ui/form';

// In your component (see entry-form.tsx):
const project = /* ... current Project ... */;
const collection = /* ... Collection with fieldDefinitions ... */;

return (
  <Form {...form}>
    <form>
      {collection.fieldDefinitions.map((fieldDefinition) => (
        <FormFieldFromDefinition
          key={fieldDefinition.id}
          fieldDefinition={fieldDefinition}
          form={form}
          name={`values.${fieldDefinition.slug}.content.${project.settings.language.default}`}
          supportedLanguages={project.settings.language.supported}
        />
      ))}
    </form>
  </Form>
);
```

`FormFieldFromDefinition` takes the form via the `form` prop (not `control`) and a required `name`: the path to the field's default-language content in the form values. The translatable dialog derives the other languages from this path, so the `name` must end in `.<language>`.

### Reference fields (asset and entry)

The `asset` and `entry` field types differ from scalar fields. Their `valueType` is `reference`, and their value is an array of references (`{ id, objectType }`), not a single value.

Their inputs fetch data from within the form. `FormAssetField` and `FormEntryField` (in [`form.tsx`](../../src/renderer/components/ui/form.tsx)) load the selectable Assets or Entries with TanStack Query (the entry field uses `useQueriesNoError` to load Entries across several Collections), render a selection UI, and enforce `fieldDefinition.max` directly in the UI (further selection is disabled once the limit is reached).

Their definition forms add type-specific options:

- The asset definition form ([`asset-field-definition.tsx`](../../src/renderer/components/forms/asset-field-definition.tsx)) exposes `min` / `max` (how many Assets may be selected) through its spec's `Extras`.
- The entry definition form ([`entry-field-definition.tsx`](../../src/renderer/components/forms/entry-field-definition.tsx)) adds an `ofCollections` list that restricts which Collections can be referenced (backed by a Collections query), plus `min` / `max`.

> [!NOTE]
> Core's asset definition also carries `ofAssetMimeTypes`, which the asset definition form does not expose yet. Keep that in mind before assuming the asset form is complete.

## Validation with Zod

All user input validation uses [Zod](https://zod.dev/), a TypeScript-first schema validation library.

### Schema Generation

**Source:** [@elek-io/core](https://github.com/elek-io/core)

Core provides utilities to convert field definitions into Zod schemas:

- **`getValueSchemaFromFieldDefinition()`**: Generates a Zod schema for a single field
- See [schema generation utilities](https://github.com/elek-io/core/blob/main/src/schema/schemaFromFieldDefinition.ts) for more functions

**Example:**

```typescript
import { getValueSchemaFromFieldDefinition } from '@elek-io/core';

const fieldDefinition = {
  valueType: 'string',
  min: 5,
  max: 100,
  isRequired: true,
  // ...
};

// Generated schema validates:
// - Type is string
// - Length between 5-100 characters
// - Field is required (not null/undefined)
// The second argument is the Project's supported languages (ProjectLanguages)
const schema = getValueSchemaFromFieldDefinition(
  fieldDefinition,
  project.settings.language.supported
);
```

### Form Validation

Use the generated Zod schema with [React Hook Form's Zod resolver](https://react-hook-form.com/get-started#SchemaValidation):

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  flattenFieldDefinitions,
  getUpdateEntrySchemaFromFieldDefinitions,
} from '@elek-io/core';

const collection = /* ... */;

// Generate schema from all field definitions
// fieldDefinitions is a FieldDefinitionOrGroup[], and grouping does not affect the
// generated schema, so flatten it first (see "Field definition groups").
// The second argument is the Project's supported languages.
const schema = getUpdateEntrySchemaFromFieldDefinitions(
  flattenFieldDefinitions(collection.fieldDefinitions),
  project.settings.language.supported
);

// Create form with validation. Do NOT pass an explicit useForm generic here, see
// "Form typing" below.
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { /* ... */ }
});

// Form validates automatically and shows error messages via FormMessage component
```

### Submitting from the page header (`form={id}` and `noValidate`)

A form's primary action (Create, Save changes) is rendered in the `Page` header
through `Page`'s `actions`, which is outside the `<form>` subtree. The button
associates back to the form with `type="submit"` and `form={id}`, where the same
`id` (from `useId()`) is passed to the form component. `Button` defaults to
`type="button"`, so a submit button has to opt in with `type="submit"`.

Because that button submits the form natively, the form must set `noValidate`.
Zod (through react-hook-form) is the single source of validation, and the inputs
carry native constraints too (`FormFieldFromDefinition` sets `required` from
`isRequired`, and the Collection editor renders required field-definition preview
inputs). Without `noValidate` the browser's native constraint check runs first,
blocks the submit on an empty required input, and shows its own default message,
so the `submit` event and `handleSubmit` never fire and no Zod error is shown.
Every react-hook-form form that submits (the shared `*Form` components and the
standalone route forms) sets `noValidate` for this reason.

### Form typing (react-hook-form + generated schemas)

The generated entry and collection schemas transform a loose input into the strict `*Props` output (their `values` is a `z.pipe`, and Collections carry recursive mdast), so their `z.input` differs from their `z.output`. Two rules follow, both applied throughout the form code:

- **Do not pass an explicit `useForm<...>()` generic** when the resolver comes from a generated or recursive Core schema. Let react-hook-form infer the types from `zodResolver(schema)`: the form values become the schema input (a loose `values` record) and `handleSubmit` yields the typed output (`CreateEntryProps` and so on). What actually breaks is passing the `*Props` output type as the sole generic: it makes the resolver unassignable and, for the recursive Collection schema, produces the "two unrelated types" error. A matched `useForm<z.input, unknown, z.output>` triple does type-check, even for the recursive schema, but inference is simpler and is what the code uses.
- **Shared form components are generic over the schema input shape**, not the `*Props` union, so a concrete caller form (create, update, or a view-only diff) is assignable without variance errors. `EntryForm` / `CollectionForm` / `ProjectForm` / `DefaultFieldDefinitionForm` take `UseFormReturn<TFieldValues, unknown, TTransformedValues>` and narrow to a concrete props type internally to address literal paths (RHF's `FieldPath` cannot resolve a path for an unresolved generic). The Collection editor manages its `fieldDefinitions` field array as opaque `{ id }` rows because react-hook-form cannot type a field array whose element is the deep `FieldDefinitionOrGroup` union.

**Benefits:**

- Type-safe form data (inferred from generated Zod schema)
- Automatic validation based on field definitions
- Consistent validation between frontend and backend
- User-friendly error messages
- Prevents invalid data from reaching Core
