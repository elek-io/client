import { expect, type Page } from '@playwright/test';

import {
  uuid,
  type Collection,
  type CreateCollectionProps,
  type EmailFieldDefinition,
  type ReferenceFieldDefinition,
  type TextFieldDefinition,
} from '@elek-io/core';

import { navigate } from './navigation.js';

/**
 * Build a required single-line text FieldDefinition with a caller-supplied id.
 * A Collection needs at least one field, and Core matches definitions by id, so
 * each call gets a fresh UUID unless one is passed in the overrides.
 */
export function textFieldDefinition(
  overrides: Partial<TextFieldDefinition> = {}
): TextFieldDefinition {
  return {
    id: uuid(),
    slug: 'title',
    label: { en: 'Title' },
    description: null,
    isRequired: true,
    isDisabled: false,
    isUnique: false,
    inputWidth: '12',
    valueType: 'string',
    fieldType: 'text',
    defaultValue: null,
    min: null,
    max: null,
    ...overrides,
  };
}

/**
 * Build a required email FieldDefinition with a caller-supplied id. Mirrors
 * `textFieldDefinition` but with `fieldType` "email", so a Collection can drive
 * both the required and format validation paths. Email definitions carry no
 * min/max, so those keys are absent here.
 */
export function emailFieldDefinition(
  overrides: Partial<EmailFieldDefinition> = {}
): EmailFieldDefinition {
  return {
    id: uuid(),
    slug: 'email',
    label: { en: 'Email' },
    description: null,
    isRequired: true,
    isDisabled: false,
    isUnique: false,
    inputWidth: '12',
    valueType: 'string',
    fieldType: 'email',
    defaultValue: null,
    ...overrides,
  };
}

/**
 * The entry arm of the `ReferenceFieldDefinition` union (an `entry` reference,
 * as opposed to an `asset` one). Extracted so the builder's overrides are typed
 * against the concrete member rather than the whole union.
 */
type EntryReferenceFieldDefinition = Extract<
  ReferenceFieldDefinition,
  { fieldType: 'entry' }
>;

/**
 * Build an optional single-entry reference FieldDefinition with a caller-supplied
 * id. Mirrors `textFieldDefinition` but points at another Entry: `fieldType`
 * "entry", `ofCollections` empty (any Collection), `max` 1 (a single reference).
 * Used to arrange a Collection whose Entries can point at one another, so a sync
 * rebase can orphan a reference target.
 */
export function referenceFieldDefinition(
  overrides: Partial<EntryReferenceFieldDefinition> = {}
): ReferenceFieldDefinition {
  return {
    id: uuid(),
    slug: 'related',
    label: { en: 'Related' },
    description: null,
    isRequired: false,
    isDisabled: false,
    isUnique: false,
    inputWidth: '12',
    valueType: 'reference',
    fieldType: 'entry',
    ofCollections: [],
    min: null,
    max: 1,
    ...overrides,
  };
}

/**
 * Create a Collection directly over IPC, bypassing the UI.
 *
 * Use this to arrange a precondition a test depends on but does not itself
 * verify. `projectId` is required, everything else defaults to a valid
 * single-language Collection with one required text field ("title"). To
 * exercise the create flow through the form, use `createCollection`.
 */
export async function createCollectionViaIpc(
  page: Page,
  overrides: Partial<CreateCollectionProps> & { projectId: string }
): Promise<Collection> {
  const props: CreateCollectionProps = {
    icon: 'home',
    name: {
      singular: { en: 'Article' },
      plural: { en: 'Articles' },
    },
    description: { en: 'Articles created by the E2E tests' },
    slug: {
      singular: 'article',
      plural: 'articles',
    },
    fieldDefinitions: [textFieldDefinition()],
    ...overrides,
  };

  return page.evaluate(
    async (p) => window.ipc.core.collections.create(p),
    props
  );
}

/** Route to a Collection's Entry list and confirm the app rendered there. */
export async function navigateToCollection(
  page: Page,
  ids: { projectId: string; collectionId: string }
): Promise<void> {
  await navigate(
    page,
    `#/projects/${ids.projectId}/collections/${ids.collectionId}`
  );
}

/** Route to the Collection create form and confirm the app rendered there. */
export async function navigateToCollectionCreate(
  page: Page,
  projectId: string
): Promise<void> {
  await navigate(page, `#/projects/${projectId}/collections/create`);
}

/** Route to a Collection's configure (update) page and confirm it rendered. */
export async function navigateToCollectionSettings(
  page: Page,
  ids: { projectId: string; collectionId: string }
): Promise<void> {
  await navigate(
    page,
    `#/projects/${ids.projectId}/collections/${ids.collectionId}/update`
  );
}

/** Fill the visible base fields of the Collection form (single language). */
export async function fillCollectionForm(
  page: Page,
  props: {
    namePlural: string;
    nameSingular: string;
    description: string;
    slugPlural: string;
    slugSingular: string;
  }
): Promise<void> {
  await page
    .getByLabel('Collection name (Plural)', { exact: true })
    .fill(props.namePlural);
  await page
    .getByLabel('Entry name (Singular)', { exact: true })
    .fill(props.nameSingular);
  await page.getByLabel('Description', { exact: true }).fill(props.description);
  await page
    .getByLabel('Collection-Slug', { exact: true })
    .fill(props.slugPlural);
  await page.getByLabel('Entry-Slug', { exact: true }).fill(props.slugSingular);
}

/**
 * Drive the "Add Field" sheet to append one text field definition. Opens the
 * sheet, fills the translatable label and description (the slug auto-derives
 * from the label), then confirms with "Add definition".
 */
export async function addFieldDefinition(
  page: Page,
  props: { label: string; description: string }
): Promise<void> {
  await page.getByRole('button', { name: 'Add Field' }).click();
  const sheet = page.getByRole('dialog', {
    name: 'Add a Field to this Collection',
  });
  await expect(sheet).toBeVisible();

  // The "Input type" select defaults to "text", so no change is needed here.
  await sheet.getByLabel('Label', { exact: true }).fill(props.label);
  await sheet
    .getByLabel('Description', { exact: true })
    .fill(props.description);

  await page.getByRole('button', { name: 'Add definition' }).click();
  await expect(sheet).toBeHidden();
}

/**
 * Create a Collection through the form and wait for the redirect to its detail
 * page. Starts on the Collection create route, returns the new Collection's id
 * parsed from the resulting route.
 */
export async function createCollection(
  page: Page,
  props: {
    namePlural: string;
    nameSingular: string;
    description: string;
    slugPlural: string;
    slugSingular: string;
    field: { label: string; description: string };
  }
): Promise<string> {
  await fillCollectionForm(page, props);
  await addFieldDefinition(page, props.field);

  await page.getByRole('button', { name: 'Create Collection' }).click();
  await expect(page).toHaveURL(/#\/projects\/[^/]+\/collections\/[^/]+$/);

  const hash = new URL(page.url()).hash;
  const collectionId = hash.split('/')[4];
  if (collectionId === undefined) {
    throw new Error(`Expected a collection id in the route, got "${hash}"`);
  }
  return collectionId;
}
