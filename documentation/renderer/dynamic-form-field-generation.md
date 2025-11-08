# Dynamic form field generation

Handling static forms that stay the same is straight forward. We simply use the correct input component and attach it to the forms field. But when it comes to user defined forms it gets tricky.

We want to be able to define a form field in a way that it can be rendered dynamically. This means we need to define what type of input it is, what label and description it has, if it is required and so on.

This is done using field definitions. A field definition is simply a JSON object that contains all the necessary information to render a form field.

When a user creates a Collection he can define those field definitions:

```typescript
{
  id: '467e57ea-e04a-44a7-b34b-684ed3ba6f49',
  valueType: 'string',
  fieldType: 'text',
  label: {
    en: 'Title',
    de: 'Titel',
  },
  description: {
    en: 'A short title for the Entry',
    de: 'Ein kurzer Titel für den Eintrag',
  },
  min: null,
  max: 100,
  defaultValue: null,
  inputWidth: '12',
  isDisabled: false,
  isRequired: true,
  isUnique: false,
}
```

## UI for defining field definitions

When creating or updating a Collection, the user can add, remove and edit field definitions. You can find the UI for that under [`src/renderer/components/pages/create-update-collection-page.tsx`](/src/renderer/components/pages/create-update-collection-page.tsx). It allows the user to select the field type (e.g. text, number, boolean etc.), set the label and description (with support for multiple languages), define validation rules (e.g. min/max length, if it's required etc.).

## Rendering the dynamic form

When the form to **create a new Entry** for the Collection is rendered, we loop over the field definitions and render the corresponding input component that adheres to the defined type and limitations (e.g. min/max length, if it's required etc.).

This way we can render forms dynamically based on user defined field definitions.

### UI Component overview

The following components are used:

- The [`Input`](/src/renderer/components/ui/input.tsx), [`Textarea`](/src/renderer/components/ui/textarea.tsx), [`Switch`](/src/renderer/components/ui/switch.tsx), [`Slider`](/src/renderer/components/ui/slider.tsx) and [`Select`](/src/renderer/components/ui/select.tsx) are basic HTML inputs with added styling and [Radix UI primitives](https://www.radix-ui.com/primitives) for accessibility.
- The components [`FormInputField`, `FormTextareaField`, `FormRangeField` and others](/src/renderer/components/ui/form.tsx) wrap the corresponding basic HTML component and transform the value the user put in (e.g. in case of an Input of type "number" to a number) before handing it back to the attached forms field. This is done because the inputs value internally is always a string. But this does become a problem when the form requires the type to be a number. It also returns null instead of an empty string if the user does not put in a value, since a form can allow for strings with a minimum lenght and null but an empty string should fail the validation.
- The [`FormComponentFromFieldDefinition`](/src/renderer/components/ui/form.tsx) simply takes a fieldDefinition and renders a component based on it.
- The [`FormComponentFromFieldDefinitionTranslatable`](/src/renderer/components/ui/form.tsx) extends the FormComponentFromFieldDefinition. If there are multiple supported languages, it renders a button next to the field that opens a dialog where translations for all supported languages can be entered.
- Finally, the [`FormFieldFromDefinition`](/src/renderer/components/ui/form.tsx) wraps the FormComponentFromFieldDefinitionTranslatable in a FormItem and adds a label, description and validation message. This is the component that should be used when rendering a form field based on a field definition.

## Generating validation schemas and types

All validation of user input is done using [Zod](https://zod.dev/). elek.io Core provides [predefined Zod schemas for all supported field types](https://github.com/elek-io/core/blob/main/src/schema/fieldSchema.ts).

Via the `getValueSchemaFromFieldDefinition()` or any other [schema generating function inside `@elek-io/core`](https://github.com/elek-io/core/blob/main/src/schema/schemaFromFieldDefinition.ts) the field definitions are converted to Zod schemas for validation and infered TypeScript types.

## Validating generated forms

This schema can then be used in conjunction with the [React Hook Form Zod resolver](https://react-hook-form.com/get-started#SchemaValidation) to validate the user input before the form is submitted to `@elek-io/core` via IPC and provide feedback to the user if the input is invalid.
