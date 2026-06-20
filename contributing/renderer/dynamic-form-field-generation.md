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

Each field type has its own definition form so it can expose only the options that type supports (for example `min` / `max` for `number`, `ofCollections` for `entry`). These live in [`components/forms/`](../../src/renderer/components/forms/) as `<type>-value-definition-form.tsx` files. The pieces:

- **`FieldDefinitionForm`** ([`forms/util.tsx`](../../src/renderer/components/forms/util.tsx)) is the dispatcher. It holds one `useForm()` per field type and renders the per-type form matching the selected `fieldType`. It exposes an imperative `addDefinition()` through a ref, which validates the active form, rejects duplicate slugs, and appends the new definition to the Collection's `useFieldArray`.
- **`DefaultFieldDefinitionForm`** ([`forms/default-field-definition-form.tsx`](../../src/renderer/components/forms/default-field-definition-form.tsx)) renders the fields every definition shares (label, slug, description, `inputWidth`, `isRequired`, `isUnique`, `isDisabled`) and takes the type-specific inputs as `children`. It also auto-generates the slug from the label until the user edits the slug manually.
- **Per-type forms** (e.g. [`text-value-definition-form.tsx`](../../src/renderer/components/forms/text-value-definition-form.tsx)) wrap `DefaultFieldDefinitionForm` and add only the inputs unique to that type.

`CollectionForm` ([`forms/collection-form.tsx`](../../src/renderer/components/forms/collection-form.tsx)) renders the field-type `Select` and the editor sheet, holds the `FieldDefinitionForm` ref, and calls `addDefinition()` from the sheet's footer button.

> [!NOTE]
> The type `Select` lists every Core `fieldType`, but `FieldDefinitionForm` only implements a subset. Selecting an unimplemented type (`slug`, `select`, `dynamic`, `markdown`) throws "Unsupported definition form". Adding a new field type means adding a per-type form, a `useForm()` and the matching `addDefinition` case in `util.tsx`, and confirming Core's `fieldTypeSchema` includes it.

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

Also in [`components/ui/form.tsx`](../../src/renderer/components/ui/form.tsx): a layer of reusable wrappers that bind a base control to React Hook Form and own value transformation - `FormInputField`, `FormTextareaField`, `FormDateField`, `FormRangeField`, `FormToggleField`, `FormAssetField`, `FormEntryField` (plus `TranslatableFormInputField` / `TranslatableFormTextareaField`).

These wrappers carry the value contract Core expects, so do not hand-roll a raw `<Input>`:

- They return `null` for empty values instead of empty strings (Core schemas use `.nullable()`, so `''` would fail validation)
- `FormInputField` with `type="number"` coerces the string input to a number

#### Field definition components

The three layers that turn a field definition into a rendered field, all in [`components/ui/form.tsx`](../../src/renderer/components/ui/form.tsx). Only `FormFieldFromDefinition` is exported; the other two are internal helpers. The file is large (~1500 lines) so the line numbers below are approximate and drift:

**1. `FormComponentFromFieldDefinition`** (internal, around line 1080)

- Maps a field definition's `fieldType` to the correct typed field wrapper
- Throws for field types the renderer does not support yet (for example `time`, `datetime`, `ipv4`)

**2. `FormComponentFromFieldDefinitionTranslatable`** (internal, around line 1240)

- Wraps `FormComponentFromFieldDefinition`
- Adds multi-language support for translatable fields
- Renders a dialog for entering translations in all supported languages, with a language switcher button next to the field

**3. `FormFieldFromDefinition`** (exported, recommended entry point, around line 1378)

- Use this component when rendering form fields from definitions
- Wraps `FormComponentFromFieldDefinitionTranslatable` with:
  - Label (with required indicator)
  - Description text
  - Validation error messages
  - Proper spacing and layout

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

- The asset definition form ([`asset-value-definition-form.tsx`](../../src/renderer/components/forms/asset-value-definition-form.tsx)) exposes `min` / `max` (how many Assets may be selected).
- The entry definition form ([`entry-value-definition-form.tsx`](../../src/renderer/components/forms/entry-value-definition-form.tsx)) adds an `ofCollections` list that restricts which Collections can be referenced (backed by a Collections query), plus `min` / `max`.

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
import { getUpdateEntrySchemaFromFieldDefinitions } from '@elek-io/core';

const collection = /* ... */;

// Generate schema from all field definitions
// (pass the Project's supported languages as the second argument)
const schema = getUpdateEntrySchemaFromFieldDefinitions(
  collection.fieldDefinitions,
  project.settings.language.supported
);

// Create form with validation
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { /* ... */ }
});

// Form validates automatically and shows error messages via FormMessage component
```

**Benefits:**

- Type-safe form data (inferred from generated Zod schema)
- Automatic validation based on field definitions
- Consistent validation between frontend and backend
- User-friendly error messages
- Prevents invalid data from reaching Core
