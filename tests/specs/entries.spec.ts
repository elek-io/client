import { expect, type Page } from '@playwright/test';

import type { Collection } from '@elek-io/core';

import { test } from '../fixtures/electronApp.js';
import {
  createCollectionViaIpc,
  dateFieldDefinition,
  datetimeFieldDefinition,
  emailFieldDefinition,
  navigateToCollection,
  textFieldDefinition,
  timeFieldDefinition,
  updateCollectionViaIpc,
} from '../helpers/collection.js';
import {
  createEntryViaIpc,
  fillEntryForm,
  navigateToEntryCreate,
  navigateToEntryUpdate,
  stringValue,
  temporalValue,
} from '../helpers/entry.js';
import { reloadWindow } from '../helpers/navigation.js';
import { createProjectViaIpc } from '../helpers/project.js';
import { setUserViaIpc } from '../helpers/user.js';

/**
 * Create a Collection whose translatable name, description and Title field carry
 * both 'en' and 'de'. Core requires every project-supported language to be
 * present at create time, so a Collection for a two-language Project cannot use
 * the en-only `createCollectionViaIpc` defaults. The 'en' values match those
 * defaults, so the "Create Article" action and the "Title" field label read the
 * same as in the single-language specs.
 */
async function createBilingualCollectionViaIpc(
  page: Page,
  projectId: string
): Promise<Collection> {
  return createCollectionViaIpc(page, {
    projectId,
    name: {
      singular: { en: 'Article', de: 'Artikel' },
      plural: { en: 'Articles', de: 'Artikel' },
    },
    description: {
      en: 'Articles created by the E2E tests',
      de: 'Von den E2E-Tests erstellte Artikel',
    },
    fieldDefinitions: [
      textFieldDefinition({ label: { en: 'Title', de: 'Titel' } }),
    ],
  });
}

test.describe('Entries', () => {
  test('creates an entry through the form and shows it in the table', async ({
    mainWindow,
  }) => {
    await setUserViaIpc(mainWindow);
    const project = await createProjectViaIpc(mainWindow);
    const collection = await createCollectionViaIpc(mainWindow, {
      projectId: project.id,
    });

    await navigateToEntryCreate(mainWindow, {
      projectId: project.id,
      collectionId: collection.id,
    });

    await fillEntryForm(mainWindow, { Title: 'Hello World' });
    await mainWindow.getByRole('button', { name: 'Create Article' }).click();

    // Redirecting to the Collection detail is how Core's success surfaces (the
    // create did not throw). Core owns file and commit correctness, so this spec
    // verifies only the desktop app's part: the form mapped to the right IPC
    // call, and the UI reflects the result by rendering the Entry's row with the
    // value that was entered.
    await expect(mainWindow).toHaveURL(
      new RegExp(`#/projects/[^/]+/collections/${collection.id}$`)
    );
    await expect(
      mainWindow.getByRole('cell', { name: 'Hello World' })
    ).toBeVisible();
  });

  test('updates an entry through the form, gated on a dirty change', async ({
    mainWindow,
  }) => {
    await setUserViaIpc(mainWindow);
    const project = await createProjectViaIpc(mainWindow);
    const collection = await createCollectionViaIpc(mainWindow, {
      projectId: project.id,
    });
    const entry = await createEntryViaIpc(mainWindow, {
      projectId: project.id,
      collectionId: collection.id,
      values: { title: stringValue({ en: 'Original title' }) },
    });

    await navigateToEntryUpdate(mainWindow, {
      projectId: project.id,
      collectionId: collection.id,
      entryId: entry.id,
    });

    // Wait for the form to reset from the loaded Entry. Until it settles, the
    // dirty gate cannot be trusted, so key off the Title field showing its value.
    await expect(mainWindow.getByLabel('Title', { exact: true })).toHaveValue(
      'Original title'
    );

    // Nothing edited yet, so Update is gated
    await expect(
      mainWindow.getByRole('button', { name: 'Update Article' })
    ).toBeDisabled();

    // Editing the Title dirties the form, so Update enables
    await fillEntryForm(mainWindow, { Title: 'Edited title' });
    await expect(
      mainWindow.getByRole('button', { name: 'Update Article' })
    ).toBeEnabled();
    await mainWindow.getByRole('button', { name: 'Update Article' }).click();

    // Redirecting to the Collection detail is how Core's success surfaces (the
    // update did not throw). The UI reflects the result: the Entry's row now
    // shows the edited value and the original is gone.
    await expect(mainWindow).toHaveURL(
      new RegExp(`#/projects/[^/]+/collections/${collection.id}$`)
    );
    await expect(
      mainWindow.getByRole('cell', { name: 'Edited title' })
    ).toBeVisible();
    await expect(
      mainWindow.getByRole('cell', { name: 'Original title' })
    ).toBeHidden();
  });

  test('validates required and format fields, respecting the dirty gate', async ({
    mainWindow,
  }) => {
    await setUserViaIpc(mainWindow);
    const project = await createProjectViaIpc(mainWindow);
    // A required Email field drives both the required and format paths; an
    // optional Note field exists only to dirty the form past the create gate
    // while leaving Email empty. Single language, so per-language validation
    // (P2-15's scope) stays out of the way.
    const collection = await createCollectionViaIpc(mainWindow, {
      projectId: project.id,
      fieldDefinitions: [
        emailFieldDefinition(),
        textFieldDefinition({
          slug: 'note',
          label: { en: 'Note' },
          isRequired: false,
        }),
      ],
    });

    await navigateToEntryCreate(mainWindow, {
      projectId: project.id,
      collectionId: collection.id,
    });

    // On open, the create is dirty-gated (disabled) and no field is flagged.
    // A pristine empty form cannot be submitted by design, so a "required"
    // error is only reachable after dirtying the form via another field.
    await expect(
      mainWindow.getByRole('button', { name: 'Create Article' })
    ).toBeDisabled();
    await expect(
      mainWindow.getByLabel('Email', { exact: true })
    ).toHaveAttribute('aria-invalid', 'false');

    // Required path: filling the optional Note dirties the form (Email still
    // empty), the button enables, and submitting flags Email as invalid while
    // the URL stays on the create route (nothing was created). Optional field
    // labels carry an "- optional" suffix, so match Note without exactness
    // rather than through the exact-label fillEntryForm helper.
    await mainWindow.getByLabel('Note').fill('Just a note');
    await expect(
      mainWindow.getByRole('button', { name: 'Create Article' })
    ).toBeEnabled();
    await mainWindow.getByRole('button', { name: 'Create Article' }).click();
    await expect(
      mainWindow.getByLabel('Email', { exact: true })
    ).toHaveAttribute('aria-invalid', 'true');
    await expect(mainWindow).toHaveURL(
      new RegExp(`#/projects/[^/]+/collections/${collection.id}/create$`)
    );

    // Format path: a syntactically invalid value is still flagged and blocked.
    await fillEntryForm(mainWindow, { Email: 'notanemail' });
    await mainWindow.getByRole('button', { name: 'Create Article' }).click();
    await expect(
      mainWindow.getByLabel('Email', { exact: true })
    ).toHaveAttribute('aria-invalid', 'true');
    await expect(mainWindow).toHaveURL(
      new RegExp(`#/projects/[^/]+/collections/${collection.id}/create$`)
    );

    // Valid path: a well-formed email passes validation and the create goes
    // through, shown by the redirect to the Collection detail.
    await fillEntryForm(mainWindow, { Email: 'valid@example.com' });
    await mainWindow.getByRole('button', { name: 'Create Article' }).click();
    await expect(mainWindow).toHaveURL(
      new RegExp(`#/projects/[^/]+/collections/${collection.id}$`)
    );
  });

  test('lists entries with the expected table chrome', async ({
    mainWindow,
  }) => {
    await setUserViaIpc(mainWindow);
    const project = await createProjectViaIpc(mainWindow);
    const collection = await createCollectionViaIpc(mainWindow, {
      projectId: project.id,
    });
    await createEntryViaIpc(mainWindow, {
      projectId: project.id,
      collectionId: collection.id,
      values: { title: stringValue({ en: 'First' }) },
    });
    await createEntryViaIpc(mainWindow, {
      projectId: project.id,
      collectionId: collection.id,
      values: { title: stringValue({ en: 'Second' }) },
    });

    await navigateToCollection(mainWindow, {
      projectId: project.id,
      collectionId: collection.id,
    });

    // Both known values render as table cells and the empty state is absent.
    // Asserting the values beats a row count, which would include the header.
    await expect(mainWindow.getByRole('cell', { name: 'First' })).toBeVisible();
    await expect(
      mainWindow.getByRole('cell', { name: 'Second' })
    ).toBeVisible();
    await expect(mainWindow.getByText('No results.')).toBeHidden();

    // The column-visibility dropdown and the singular-labelled create action.
    await expect(
      mainWindow.getByRole('button', { name: 'Visible Values' })
    ).toBeVisible();
    await expect(
      mainWindow.getByRole('button', { name: 'Create Article' })
    ).toBeVisible();
  });

  test('renders a persisted entry after a renderer reload', async ({
    mainWindow,
  }) => {
    await setUserViaIpc(mainWindow);
    const project = await createProjectViaIpc(mainWindow);
    const collection = await createCollectionViaIpc(mainWindow, {
      projectId: project.id,
    });
    // Land on the (empty) Entry list first, then seed over IPC, which does not
    // touch the renderer's query cache. The reload is what surfaces the Entry,
    // proving the renderer reads Core's persisted state on a fresh load rather
    // than an optimistic cache entry.
    await navigateToCollection(mainWindow, {
      projectId: project.id,
      collectionId: collection.id,
    });
    await createEntryViaIpc(mainWindow, {
      projectId: project.id,
      collectionId: collection.id,
      values: { title: stringValue({ en: 'Persisted entry' }) },
    });
    await reloadWindow(mainWindow);

    await expect(
      mainWindow.getByRole('cell', { name: 'Persisted entry' })
    ).toBeVisible();
  });

  test('creates and persists a multi-language translatable entry across both languages', async ({
    mainWindow,
  }) => {
    await setUserViaIpc(mainWindow);
    const project = await createProjectViaIpc(mainWindow, {
      settings: { language: { default: 'en', supported: ['en', 'de'] } },
    });
    const collection = await createBilingualCollectionViaIpc(
      mainWindow,
      project.id
    );

    await navigateToEntryCreate(mainWindow, {
      projectId: project.id,
      collectionId: collection.id,
    });

    // A Project with more than one supported language renders the translatable
    // widget: the default-language input plus a translations dialog. The trigger
    // (named by the Phase 0 sr-only label) is what distinguishes the multi
    // language field from a single-language plain input.
    await expect(
      mainWindow.getByRole('button', { name: 'Edit translations for Title' })
    ).toBeVisible();

    // Fill both languages through the dialog, then create.
    await fillEntryForm(mainWindow, { Title: { en: 'Hello', de: 'Hallo' } });
    await mainWindow.getByRole('button', { name: 'Create Article' }).click();

    // The create did not throw, shown by the redirect to the Collection detail.
    await expect(mainWindow).toHaveURL(
      new RegExp(`#/projects/[^/]+/collections/${collection.id}$`)
    );

    // Persistence: open the new Entry's update form (the table cell shows the
    // project-default 'en' value), reload to force a fresh read from Core, then
    // open the translations dialog and confirm both languages persisted.
    await mainWindow.getByRole('cell', { name: 'Hello' }).click();
    await expect(mainWindow).toHaveURL(
      new RegExp(`#/projects/[^/]+/collections/${collection.id}/[^/]+/update$`)
    );
    await reloadWindow(mainWindow);

    const updateTrigger = mainWindow.getByRole('button', {
      name: 'Edit translations for Title',
    });
    await expect(updateTrigger).toBeVisible();
    await updateTrigger.click();

    const dialog = mainWindow.getByRole('dialog', { name: 'Title' });
    await expect(dialog.getByLabel('en', { exact: true })).toHaveValue('Hello');
    await expect(dialog.getByLabel('de', { exact: true })).toHaveValue('Hallo');
  });

  test('flags a required translatable field invalid when a language is left empty', async ({
    mainWindow,
  }) => {
    await setUserViaIpc(mainWindow);
    const project = await createProjectViaIpc(mainWindow, {
      settings: { language: { default: 'en', supported: ['en', 'de'] } },
    });
    const collection = await createBilingualCollectionViaIpc(
      mainWindow,
      project.id
    );

    await navigateToEntryCreate(mainWindow, {
      projectId: project.id,
      collectionId: collection.id,
    });

    // On open the translations trigger is not flagged (no validation has run).
    const translationsTrigger = mainWindow.getByRole('button', {
      name: 'Edit translations for Title',
    });
    await expect(translationsTrigger).toHaveAttribute('aria-invalid', 'false');

    // Fill only 'en' through the dialog, leaving the required 'de' empty. Filling
    // one language dirties the form, so the create button leaves the dirty gate.
    await fillEntryForm(mainWindow, { Title: { en: 'Only English' } });
    const createButton = mainWindow.getByRole('button', {
      name: 'Create Article',
    });
    await expect(createButton).toBeEnabled();
    await createButton.click();

    // Per-language required validation blocks the submit: nothing is created
    // (still on the create route) and the translations trigger flips to invalid
    // (its aria-invalid tracks errors in the other, non-default languages).
    await expect(mainWindow).toHaveURL(
      new RegExp(`#/projects/[^/]+/collections/${collection.id}/create$`)
    );
    await expect(translationsTrigger).toHaveAttribute('aria-invalid', 'true');
  });

  test('formats temporal fields and relative columns per the user language', async ({
    mainWindow,
  }) => {
    await setUserViaIpc(mainWindow, { language: 'de' });
    const project = await createProjectViaIpc(mainWindow);
    const collection = await createCollectionViaIpc(mainWindow, {
      projectId: project.id,
      fieldDefinitions: [
        textFieldDefinition(),
        dateFieldDefinition(),
        datetimeFieldDefinition(),
        timeFieldDefinition(),
      ],
    });
    await createEntryViaIpc(mainWindow, {
      projectId: project.id,
      collectionId: collection.id,
      values: {
        title: stringValue({ en: 'Temporal entry' }),
        published: temporalValue({ en: '2026-01-15' }),
        'event-at': temporalValue({ en: '2026-01-15T09:30:00.000Z' }),
        'opens-at': temporalValue({ en: '14:30:00' }),
      },
    });

    await navigateToCollection(mainWindow, {
      projectId: project.id,
      collectionId: collection.id,
    });

    // The temporal columns render (their header is present) and the Entry's row
    // is the stable anchor by its title cell.
    await expect(
      mainWindow.getByRole('columnheader', { name: 'Published' })
    ).toBeVisible();
    const row = mainWindow.getByRole('row', { name: /Temporal entry/ });

    // Wait until the on-demand `date-fns/locale/de` import resolves and the
    // relative Created/Updated column re-renders in German ("vor" is the German
    // "ago" prefix; the en-US fallback would read "... ago"). The fixture's
    // console assertion independently proves the dynamic import did not fail.
    await expect(row).toContainText('vor');
    const deRow = await row.innerText();

    // Switch the User to English and reload, so the renderer re-reads the User
    // and reformats the same Entry for 'en'.
    await setUserViaIpc(mainWindow, { language: 'en' });
    await reloadWindow(mainWindow);

    const enRowLocator = mainWindow.getByRole('row', {
      name: /Temporal entry/,
    });
    await expect(enRowLocator).toContainText('ago');
    const enRow = await enRowLocator.innerText();

    // Language drives formatting: the same Entry renders differently in the two
    // languages (German words and date/time formats vs English), which is a
    // stronger and less brittle assertion than pinning an exact format string.
    expect(deRow).not.toEqual(enRow);
    expect(deRow).toContain('vor');
    expect(enRow).toContain('ago');
  });

  test('back-fills a newly added field default on entry update without losing existing values', async ({
    mainWindow,
  }) => {
    // P1-08. Field A is the default required "title"; seed an Entry holding only
    // A, then add field B (an optional text field with a default) to the
    // Collection after the Entry exists.
    await setUserViaIpc(mainWindow);
    const project = await createProjectViaIpc(mainWindow);
    const collection = await createCollectionViaIpc(mainWindow, {
      projectId: project.id,
    });
    const entry = await createEntryViaIpc(mainWindow, {
      projectId: project.id,
      collectionId: collection.id,
      values: { title: stringValue({ en: 'x' }) },
    });

    // updateCollectionViaIpc takes the full UpdateCollectionProps, so spread the
    // Collection plus projectId (as the update form does) with B appended.
    await updateCollectionViaIpc(mainWindow, {
      ...collection,
      projectId: project.id,
      fieldDefinitions: [
        ...collection.fieldDefinitions,
        textFieldDefinition({
          slug: 'subtitle',
          label: { en: 'Subtitle' },
          isRequired: false,
          defaultValue: 'Default subtitle',
        }),
      ],
    });

    await navigateToEntryUpdate(mainWindow, {
      projectId: project.id,
      collectionId: collection.id,
      entryId: entry.id,
    });

    // The update form back-fills B's default while preserving A's stored value.
    // A is exact "Title"; B is optional, so its label carries an "- optional"
    // suffix and is matched without exactness.
    await expect(mainWindow.getByLabel('Title', { exact: true })).toHaveValue(
      'x'
    );
    await expect(mainWindow.getByLabel('Subtitle')).toHaveValue(
      'Default subtitle'
    );

    // Back-filling alone does not dirty the form (opening an Entry after a
    // schema change is not a user edit), so the update stays dirty-gated.
    const updateButton = mainWindow.getByRole('button', {
      name: 'Update Article',
    });
    await expect(updateButton).toBeDisabled();

    // Editing the new field (B, leaving A untouched) dirties the form and
    // enables the save, so a successful save proves A was not lost.
    await mainWindow.getByLabel('Subtitle').fill('Custom subtitle');
    await expect(updateButton).toBeEnabled();
    await updateButton.click();

    // The update did not throw, shown by the redirect to the Collection detail.
    await expect(mainWindow).toHaveURL(
      new RegExp(`#/projects/[^/]+/collections/${collection.id}$`)
    );

    // A fresh read reflects both values: A preserved and B round-tripped.
    await reloadWindow(mainWindow);
    await expect(
      mainWindow.getByRole('cell', { name: 'x', exact: true })
    ).toBeVisible();
    await expect(
      mainWindow.getByRole('cell', { name: 'Custom subtitle' })
    ).toBeVisible();
  });

  test('paginates and filters the entry table client side', async ({
    mainWindow,
  }) => {
    // P3-09. Seed 11 Entries, one past the page size of 10, so a second page
    // exists. Titles are zero-padded so an exact cell locator is unambiguous.
    await setUserViaIpc(mainWindow);
    const project = await createProjectViaIpc(mainWindow);
    const collection = await createCollectionViaIpc(mainWindow, {
      projectId: project.id,
    });
    for (let i = 1; i <= 11; i++) {
      await createEntryViaIpc(mainWindow, {
        projectId: project.id,
        collectionId: collection.id,
        values: {
          title: stringValue({ en: `Entry ${String(i).padStart(2, '0')}` }),
        },
      });
    }

    await navigateToCollection(mainWindow, {
      projectId: project.id,
      collectionId: collection.id,
    });

    // The route loads the whole Collection (limit 0) and the table paginates it
    // client side at a page size of 10. Wait for the real table (its "Title"
    // header, not the skeleton), then the first page shows 10 data rows plus the
    // header row.
    await expect(
      mainWindow.getByRole('columnheader', { name: 'Title' })
    ).toBeVisible();
    await expect(mainWindow.getByRole('row')).toHaveCount(11);

    // The pagination controls are hrefless anchors (a generic role, so their
    // disabled state is only exposed through aria-disabled, not a native
    // disabled property) named by their aria-label. On the first page Previous
    // is disabled and Next is enabled (11 over a page size of 10 is two pages).
    const previous = mainWindow.getByLabel('Go to previous page');
    const next = mainWindow.getByLabel('Go to next page');
    await expect(previous).toHaveAttribute('aria-disabled', 'true');
    await expect(next).toHaveAttribute('aria-disabled', 'false');

    // Advancing pages the rows: the second page holds the 11th Entry, so one data
    // row plus the header remain, and the control state flips.
    await next.click();
    await expect(mainWindow.getByRole('row')).toHaveCount(2);
    await expect(previous).toHaveAttribute('aria-disabled', 'false');
    await expect(next).toHaveAttribute('aria-disabled', 'true');

    // Going back restores the full first page.
    await previous.click();
    await expect(mainWindow.getByRole('row')).toHaveCount(11);
    await expect(previous).toHaveAttribute('aria-disabled', 'true');
    await expect(next).toHaveAttribute('aria-disabled', 'false');

    // The filter narrows the rows client side across every page. 'Entry 11'
    // started on the second page, so a match proves the filter also resets to
    // the first page (one data row plus the header).
    const filter = mainWindow.getByPlaceholder('Filter Articles...');
    await filter.fill('Entry 11');
    await expect(mainWindow.getByRole('row')).toHaveCount(2);
    await expect(
      mainWindow.getByRole('cell', { name: 'Entry 11', exact: true })
    ).toBeVisible();

    // The summary counts the match against the whole Collection, not just the
    // filtered rows: "1 of 11 total". A regression to getRowCount() (the filtered
    // count) would read "1 of 1 total".
    await expect(mainWindow.getByText('Showing 1 of 11 total')).toBeVisible();

    // A substring matches every title that contains it: 'Entry 1' matches
    // 'Entry 10' and 'Entry 11' (two data rows plus the header).
    await filter.fill('Entry 1');
    await expect(mainWindow.getByRole('row')).toHaveCount(3);

    // A no-match filter collapses to the "No results." row.
    await filter.fill('zzzzz');
    await expect(mainWindow.getByText('No results.')).toBeVisible();

    // Clearing the filter restores the full first page.
    await filter.fill('');
    await expect(mainWindow.getByRole('row')).toHaveCount(11);
  });
});
