# Not Yet Implemented

A running list of things `@elek-io/core` already supports but the client has no working UI for yet. The goal is to make the gap visible and to give whoever picks it up a head start.

When you find a Core capability that the client cannot use yet (a field type with no form, an option Core validates but no input exposes, a value shape the renderer cannot draw), add an entry here. Keep each entry short and include:

- **Core support** - what Core provides (schema, type, or function).
- **Client today** - what the client does instead, including any crash or silent fallback.
- **Where to start** - the files and functions a contributor would touch first.
- **Notes** - gotchas, product decisions, or links.

Remove an entry once the feature works end to end.

## Field types

Core's `fieldTypeSchema` defines 18 field types. The client implements a subset.

- **Working end to end** (14): `text`, `textarea`, `number`, `range`, `toggle`, `asset`, `entry`, `date`, `datetime`, `time`, `email`, `url`, `telephone`, `ipv4`.
- **Not yet implemented** (4): `select`, `slug`, `dynamic`, `markdown`. These are shown **disabled** in the "Add Field" picker so they cannot be authored, and any that still reach the client (through Core, the API, or a migration) render as a muted placeholder instead of crashing (see [Rendering unsupported field types](#rendering-unsupported-field-types)).

Two sets are the source of truth for "what is implemented". Keep them in sync when adding a type:

- `unimplementedFieldTypes` in [`collection-form.tsx`](../src/renderer/components/forms/collection-form.tsx) - types disabled in the picker.
- `renderableFieldTypes` in [`ui/form.tsx`](../src/renderer/components/ui/form.tsx) - types `FormComponentFromFieldDefinition` can draw.

### What each missing type needs

- **`select`, `slug`, `dynamic`, `markdown`**: a definition form, a renderer, and for some, Collection-level wiring. Core has `stringSelectFieldDefinitionSchema` / `numberSelectFieldDefinitionSchema`, `slugFieldDefinitionSchema`, `dynamicFieldDefinitionSchema`, `markdownFieldDefinitionSchema`. `slug` references sibling fields, `dynamic` references Components, and `markdown` also needs an mdast editor and renderer.

### To implement a type

1. Add a `<type>-value-definition-form.tsx`, plus a `useForm` and an `addDefinition` case in [`forms/util.tsx`](../src/renderer/components/forms/util.tsx).
2. Add a case to `FormComponentFromFieldDefinition` in [`ui/form.tsx`](../src/renderer/components/ui/form.tsx), and add the type to `renderableFieldTypes`.
3. Remove the type from `unimplementedFieldTypes` in [`collection-form.tsx`](../src/renderer/components/forms/collection-form.tsx).
4. Confirm Core's `fieldTypeSchema` includes it.

### Rendering unsupported field types

`FormFieldFromDefinition` ([`ui/form.tsx`](../src/renderer/components/ui/form.tsx)) checks `renderableFieldTypes` and renders a muted "can't be displayed yet" placeholder for any type it does not know. So a Collection that contains an unsupported field (from Core, the API, or a migration) does not crash the entry form, the collection editor, or a diff. The actual renderer components are still missing (see above).

## Asset field definition: `ofAssetMimeTypes`

- **Core support**: `assetFieldDefinitionSchema` carries `ofAssetMimeTypes` to restrict which mime types an Asset field accepts.
- **Client today**: the asset definition form ([`asset-value-definition-form.tsx`](../src/renderer/components/forms/asset-value-definition-form.tsx)) does not expose it, so it always stays at its default.
- **Where to start**: add a mime type selector to the asset definition form.

## Field definition groups: authoring

- **Core support**: `fieldDefinitionGroupSchema` and `FieldDefinitionOrGroup`. Groups can be created, nested members added, and reordered at the data level.
- **Client today**: groups are display only. The entry form and collection editor render existing groups as a `FieldSet`, but there is no UI to create a group, move fields into or out of one, or reorder groups. The collection field array is typed as opaque `{ id }` rows, which does not scale to authoring.
- **Where to start**: see the note in [`dynamic-form-field-generation.md`](./renderer/dynamic-form-field-generation.md). When authoring lands, consider managing `fieldDefinitions` as typed React state (a `useReducer` over `FieldDefinitionOrGroup[]`) instead of `useFieldArray`, so nesting and reordering are typed tree operations.

## Entry table: value columns render empty

- **Client today**: `EntryTable` ([`entry-table.tsx`](../src/renderer/components/entry-table.tsx)) computes a display value per field slug but the value columns define no `cell` renderer, so those cells render empty. Only the fixed columns show data.
- **Where to start**: add a `cell` renderer per column that formats the value by field type (text, reference count, toggle, date).

## Range field: fixed step

- **Core support**: pending. The range field has `min` and `max` but no `step`.
- **Client today**: `FormComponentFromFieldDefinition` hardcodes `step={1}` with a `@todo`.
- **Where to start**: add `step` to Core's range field definition first, then expose it in the range definition form and pass it through.
