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
  min: null,                  // Minimum length (for strings/arrays)
  max: 100,                   // Maximum length
  defaultValue: null,         // Default value when creating new Entry
  inputWidth: '12',           // Grid column width (1-12)
  isDisabled: false,          // Whether field is read-only
  isRequired: true,           // Whether field must be filled
  isUnique: false,            // Whether value must be unique across Entries
}
```

**Key Properties:**

Depending on the field type, definitions may include different properties, but common ones are:

- `id`: Unique identifier for this field
- `valueType`: The data type (`string`, `number`, `boolean`, etc.) - used for validation
- `fieldType`: The UI component type (`text`, `textarea`, `number`, `switch`, `select`, etc.)
- `label` / `description`: Translatable strings for multiple languages that help users understand the field's purpose
- `min` / `max`: Validation constraints
- `isRequired`: Whether the field must have a value
- `inputWidth`: Responsive grid width (using 12-column grid)

## Creating Field Definitions via a Collection

When users create or update a Collection, they use a visual editor to define the fields for that Collection type.

**Location:** [`components/pages/create-update-collection-page.tsx`](../../src/renderer/components/pages/create-update-collection-page.tsx)

**Features:**

- Add, remove, and reorder fields via drag-and-drop
- Select field type (text, textarea, number, boolean, select, etc.)
- Set labels and descriptions with multi-language support
- Configure validation rules (min/max length, required, unique)
- Set default values and input width
- Preview how the form will look to content editors

## Rendering Dynamic Forms

When rendering a form to create or edit an Entry, we iterate over the Collection's field definitions and render appropriate form controls for each field.

**Location:** See [`components/pages/create-update-entry-page.tsx`](../../src/renderer/components/pages/create-update-entry-page.tsx) for usage.

### Component Architecture

The dynamic form rendering system is built with layered components, each adding functionality:

#### Base UI Components

Located in [`components/ui/`](../../src/renderer/components/ui/):

- **`Input`**, **`Textarea`**, **`Switch`**, **`Slider`**, **`Select`**: Basic HTML form controls with styling and [Radix UI primitives](https://www.radix-ui.com/primitives) for accessibility
- These are the fundamental building blocks used across the application

#### Form Field Components

Located in [`components/ui/form.tsx`](../../src/renderer/components/ui/form.tsx):

**1. `FormComponentFromFieldDefinition`** (line ~290)

- Takes a field definition and renders the appropriate input component
- Handles value transformation (e.g., converting string inputs to numbers)
- Returns `null` for empty values instead of empty strings (important for validation)
- Maps `fieldType` to the correct UI component

**2. `FormComponentFromFieldDefinitionTranslatable`** (line ~420)

- Extends `FormComponentFromFieldDefinition`
- Adds multi-language support for translatable fields
- Renders a dialog for entering translations in all supported languages
- Shows language switcher button next to field

**3. `FormFieldFromDefinition`** (recommended entry point)

- Use this component when rendering form fields from definitions
- Wraps `FormComponentFromFieldDefinitionTranslatable` with:
  - Label (with required indicator)
  - Description text
  - Validation error messages
  - Proper spacing and layout

### Example Usage

```typescript
import { FormFieldFromDefinition } from '@renderer/components/ui/form';

// In your component:
const collection = /* ... Collection with fieldDefinitions ... */;

return (
  <Form {...form}>
    <form>
      {collection.fieldDefinitions.map((fieldDef) => (
        <FormFieldFromDefinition
          key={fieldDef.id}
          fieldDefinition={fieldDef}
          control={form.control}
          supportedLanguages={['en', 'de']}
        />
      ))}
    </form>
  </Form>
);
```

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
const schema = getValueSchemaFromFieldDefinition(fieldDefinition);
```

### Form Validation

Use the generated Zod schema with [React Hook Form's Zod resolver](https://react-hook-form.com/get-started#SchemaValidation):

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { getUpdateEntrySchemaFromFieldDefinitions } from '@elek-io/core';

const collection = /* ... */;

// Generate schema from all field definitions
const schema = getUpdateEntrySchemaFromFieldDefinitions(
  collection.fieldDefinitions
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

---

**Last Updated:** 2025-11-18
