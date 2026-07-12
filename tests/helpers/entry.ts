import { type Page } from '@playwright/test';

import type {
  CreateEntryProps,
  Entry,
  ReferencedValue,
  SupportedLanguage,
} from '@elek-io/core';

import { navigate } from './navigation.js';

/**
 * Build a translatable string Entry Value in the shape Core expects, keyed by
 * language. Entry Values are keyed by their field's slug, so pass the result
 * under that slug in `createEntryViaIpc`'s `values`.
 */
export function stringValue(
  content: Partial<Record<SupportedLanguage, string | null>>
): CreateEntryProps['values'][string] {
  return { objectType: 'value', valueType: 'string', content };
}

/**
 * Build a single-entry reference Value pointing at one target Entry. An Entry
 * reference carries both the target's `id` and its `collectionId`, since Core's
 * storage layout needs both to find the file. Pass the result under the
 * reference field's slug in `createEntryViaIpc`'s `values`.
 *
 * Called with no arguments it builds an empty reference (no target). Core still
 * requires the value wrapper for an optional reference field, with `content.en`
 * present as an array, so an Entry that holds no reference passes `referenceValue()`.
 */
export function referenceValue(
  entryId?: string,
  collectionId?: string
): ReferencedValue {
  const content =
    entryId !== undefined && collectionId !== undefined
      ? [{ id: entryId, objectType: 'entry' as const, collectionId }]
      : [];
  return {
    objectType: 'value',
    valueType: 'reference',
    content: { en: content },
  };
}

/**
 * Create an Entry directly over IPC, bypassing the UI.
 *
 * Use this to arrange a precondition a test depends on but does not itself
 * verify. `values` is keyed by field slug (see `stringValue`). To exercise the
 * create flow through the form, use the Entry create route with `fillEntryForm`.
 */
export async function createEntryViaIpc(
  page: Page,
  props: {
    projectId: string;
    collectionId: string;
    values: CreateEntryProps['values'];
  }
): Promise<Entry> {
  return page.evaluate(async (p) => window.ipc.core.entries.create(p), props);
}

/** Route to a Collection's Entry create form and confirm the app rendered. */
export async function navigateToEntryCreate(
  page: Page,
  ids: { projectId: string; collectionId: string }
): Promise<void> {
  await navigate(
    page,
    `#/projects/${ids.projectId}/collections/${ids.collectionId}/create`
  );
}

/** Route to an Entry's update form and confirm the app rendered there. */
export async function navigateToEntryUpdate(
  page: Page,
  ids: { projectId: string; collectionId: string; entryId: string }
): Promise<void> {
  await navigate(
    page,
    `#/projects/${ids.projectId}/collections/${ids.collectionId}/${ids.entryId}/update`
  );
}

/**
 * Fill the dynamically generated Entry form. Fields are keyed by their label
 * (as shown above each input), so pass a record of label to text value. Only
 * text-like fields are supported for now, which covers the current specs.
 */
export async function fillEntryForm(
  page: Page,
  fields: Record<string, string>
): Promise<void> {
  for (const [label, value] of Object.entries(fields)) {
    await page.getByLabel(label, { exact: true }).fill(value);
  }
}
