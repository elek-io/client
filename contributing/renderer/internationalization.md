# Internationalization

## Overview

elek.io is multi-language in two ways. The application UI is shown in the current user's language, and user-defined content (Collection and Entry values, labels, descriptions) is stored per language as a `TranslatableString`. A Project has a default language and a list of supported languages, and each user picks their own preferred language.

The set of language codes (`SupportedLanguage`) comes from `@elek-io/core`. The client maps each code to formatting and rendering behavior.

## Locales for dates (`loadLocale`)

[`lib/utils.ts`](../../src/renderer/lib/utils.ts) holds `localeLoaders`, a `Record<SupportedLanguage, () => Promise<Locale>>` that maps every Core language code to a dynamic import of its [date-fns](https://date-fns.org/) `Locale`. Two codes are remapped to a regional variant: `en` -> `en-US` and `zh` -> `zh-CN`. `loadLocale(language)` awaits the matching loader and caches the result, so each locale is fetched once.

The loaders are dynamic imports on purpose. date-fns ships a locale for every language, and importing all of them statically pulled roughly 400 kB into the renderer startup chunk even though only the active language is ever used. Code splitting keeps them out of that chunk and loads just the active locale at runtime.

Because the type is `Record<SupportedLanguage, ...>`, this map is still the single place that must stay in sync with Core. If Core adds a `SupportedLanguage`, this file fails to type-check until you add a loader for it here.

## Formatting datetimes (`formatDatetime`)

`formatDatetime` is provided by the [`UserProvider`](../../src/renderer/providers/UserProvider.tsx) and read through the `useUser()` (or `useProject()`) hook. It formats an ISO datetime string in the current user's locale using date-fns:

- `relative` uses `formatDistanceToNow(..., { addSuffix: true })` (for example "3 days ago")
- `absolute` uses `format(..., 'Pp')` (localized date and time)

It returns `{ relative: '-', absolute: '-' }` while the user data is still loading or when the datetime is `null`, so callers do not need to guard for those cases.

The user's locale is loaded on demand through `loadLocale`, so the first render after the user data resolves briefly formats with date-fns's en-US default until the locale chunk arrives, then re-renders in the user's locale.

```tsx
const { formatDatetime } = useUser();
const { relative, absolute } = formatDatetime({ datetime: entry.updated });
```

## Formatting field values (`formatTemporalFieldValue`)

`formatTemporalFieldValue` is provided by the same `UserProvider` and read through `useUser()` or `useProject()`. It takes a raw field value and its `fieldType`, and for `date`, `datetime` and `time` fields returns the value formatted in the current user's locale (date-fns `P`, `Pp` and `p`). Every other field type, and any non-string value, is returned unchanged. Like `formatDatetime`, it falls back to date-fns's en-US default until the user's locale chunk loads. Unlike `formatDatetime` it never shows a `-` placeholder, because a stored field value always exists and should be displayed, not hidden while the user data loads.

Date values are stored as `YYYY-MM-DD` with no time or timezone, so they are anchored to local midnight before formatting, otherwise the shown day could shift by one in a negative UTC offset. The [entry table](../../src/renderer/components/entry-table.tsx) uses this so a stored `2026-07-09` renders as a localized date instead of the raw ISO string.

```tsx
const { formatTemporalFieldValue } = useProject();

// "07/09/2026" for a date field in the en-US locale
const shown = formatTemporalFieldValue({
  value: entry.values.publishedAt,
  fieldType: 'date',
});
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
