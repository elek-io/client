# Internationalization

## Overview

elek.io is multi-language in two ways. The application UI is shown in the current user's language, and user-defined content (Collection and Entry values, labels, descriptions) is stored per language as a `TranslatableString`. A Project has a default language and a list of supported languages, and each user picks their own preferred language.

The set of language codes (`SupportedLanguage`) comes from `@elek-io/core`. The client maps each code to formatting and rendering behavior.

## Locales for dates (`importedLocales`)

[`lib/utils.ts`](../../src/renderer/lib/utils.ts) holds `importedLocales`, a `Record<SupportedLanguage, Locale>` that maps every Core language code to a [date-fns](https://date-fns.org/) `Locale`. Two codes are remapped to a regional variant: `en` -> `enUS` and `zh` -> `zhCN`.

Because the type is `Record<SupportedLanguage, Locale>`, this map is the single place that must stay in sync with Core. If Core adds a `SupportedLanguage`, this file will fail to type-check until you import the matching date-fns locale and add it here.

## Formatting datetimes (`formatDatetime`)

`formatDatetime` is provided by the [`UserProvider`](../../src/renderer/providers/UserProvider.tsx) and read through the `useUser()` (or `useProject()`) hook. It formats an ISO datetime string in the current user's locale using date-fns:

- `relative` uses `formatDistanceToNow(..., { addSuffix: true })` (for example "3 days ago")
- `absolute` uses `format(..., 'Pp')` (localized date and time)

It returns `{ relative: '-', absolute: '-' }` while the user data is still loading or when the datetime is `null`, so callers do not need to guard for those cases.

```tsx
const { formatDatetime } = useUser();
const { relative, absolute } = formatDatetime({ datetime: entry.updated });
```

## Translating content (`translateContent`)

`translateContent` is provided by the [`ProjectProvider`](../../src/renderer/providers/ProjectProvider.tsx) and read through `useProject()`. It takes a `TranslatableString` (a record keyed by language) and a `key`, and resolves a single string through a fallback chain:

1. the current user's language
2. the Project's default language
3. `en`
4. the `key` argument itself

The final step is important: when no translation exists in any of the above, it returns the `key` string as a visible placeholder, which signals that a translation is missing rather than rendering an empty string. Do not add your own redundant fallback on top of this.

```tsx
const { translateContent } = useProject();

const title = translateContent({
  key: 'collection.name.plural',
  record: collection.name.plural, // a TranslatableString
});
```

## Seeding multi-language form state (`translatableDefault`)

When a form needs a `TranslatableString` field initialized for every supported language, use `translatableDefault` from [`lib/utils.ts`](../../src/renderer/lib/utils.ts) instead of building the record by hand:

```ts
import { translatableDefault } from '@renderer/lib/utils';

// { en: null, de: null, fr: null, ... } for every supported language
label: translatableDefault({
  supportedLanguages: project.settings.language.supported,
  defaultValue: null,
});
```

This is how the field definition forms initialize their `label` and `description` defaults. See [Dynamic Form Field Generation](./dynamic-form-field-generation.md) for the matching field-name convention (`...content.<language>`) that the translatable inputs rely on.
