import { expect } from '@playwright/test';

import { test } from '../fixtures/electronApp.js';
import {
  createCollection,
  createCollectionViaIpc,
  navigateToCollectionCreate,
  navigateToCollectionSettings,
} from '../helpers/collection.js';
import { confirmDialog } from '../helpers/dialog.js';
import { createEntryViaIpc, stringValue } from '../helpers/entry.js';
import { reloadWindow } from '../helpers/navigation.js';
import { createProjectViaIpc } from '../helpers/project.js';
import { setUserViaIpc } from '../helpers/user.js';

test.describe('Collections', () => {
  test('creates a collection with a field definition and shows it in the sidebar', async ({
    mainWindow,
  }) => {
    await setUserViaIpc(mainWindow);
    const project = await createProjectViaIpc(mainWindow);

    await navigateToCollectionCreate(mainWindow, project.id);
    await createCollection(mainWindow, {
      namePlural: 'Articles',
      nameSingular: 'Article',
      description: 'The articles of this blog',
      slugPlural: 'articles',
      slugSingular: 'article',
      field: { label: 'Title', description: 'The title of the article' },
    });

    // Reaching the Collection detail (asserted inside createCollection) means
    // Core accepted the create with its field definition without throwing. Core
    // owns and separately tests file and commit correctness, so this spec
    // verifies only the desktop app's part: the create reached Core, and the UI
    // reflects the result by listing the new Collection in the sidebar. Scope to
    // the sidebar (a complementary landmark) so the matching breadcrumb crumb on
    // the detail page does not make the link locator ambiguous.
    await expect(
      mainWindow
        .getByRole('complementary')
        .getByRole('link', { name: 'Articles' })
    ).toBeVisible();
  });

  test('updates a collection through the form, gated on a dirty change', async ({
    mainWindow,
  }) => {
    await setUserViaIpc(mainWindow);
    const project = await createProjectViaIpc(mainWindow);
    const collection = await createCollectionViaIpc(mainWindow, {
      projectId: project.id,
    });

    await navigateToCollectionSettings(mainWindow, {
      projectId: project.id,
      collectionId: collection.id,
    });

    // Wait for the form to reset from the loaded Collection. Until it settles,
    // the dirty gate cannot be trusted, so key off the plural name showing.
    await expect(
      mainWindow.getByLabel('Collection name (Plural)', { exact: true })
    ).toHaveValue('Articles');

    // Nothing edited yet, so Save is gated (matches project/entry after the fix)
    await expect(
      mainWindow.getByRole('button', { name: 'Save changes' })
    ).toBeDisabled();

    // Rename the plural name and edit the description. Leave the slugs untouched,
    // a slug change is the schema-cascade flow and out of scope here.
    await mainWindow
      .getByLabel('Collection name (Plural)', { exact: true })
      .fill('Guides');
    await mainWindow
      .getByLabel('Description', { exact: true })
      .fill('Guides created by the E2E tests');

    // The edit dirties the form, so Save enables
    await expect(
      mainWindow.getByRole('button', { name: 'Save changes' })
    ).toBeEnabled();
    await mainWindow.getByRole('button', { name: 'Save changes' }).click();

    // Redirecting to the Collection detail is how Core's success surfaces (the
    // update did not throw). Core owns file and commit correctness.
    await expect(mainWindow).toHaveURL(
      new RegExp(`#/projects/[^/]+/collections/${collection.id}$`)
    );

    // Reload so the sidebar re-reads from Core rather than an optimistic cache
    // entry, proving the rename persisted, then see the new plural name listed.
    // Scope to the sidebar (a complementary landmark) so the matching breadcrumb
    // crumb on the detail page does not make the link locator ambiguous.
    await reloadWindow(mainWindow);
    await expect(
      mainWindow
        .getByRole('complementary')
        .getByRole('link', { name: 'Guides' })
    ).toBeVisible();
  });

  test('deletes a collection and removes it from the UI', async ({
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
      values: { title: stringValue({ en: 'Doomed entry' }) },
    });

    await navigateToCollectionSettings(mainWindow, {
      projectId: project.id,
      collectionId: collection.id,
    });

    await mainWindow.getByRole('button', { name: 'Delete Collection' }).click();
    await confirmDialog(mainWindow, 'Yes, delete this Collection');

    // The delete redirecting to the Collections list is how Core's success
    // surfaces (it did not throw). The UI reflects the removal: the Collection
    // is gone from the sidebar and the empty state shows. Its seeded Entry went
    // with it (Core's cascade, which Core tests), so there is no Collection left
    // to view Entries under.
    await expect(mainWindow).toHaveURL(/#\/projects\/[^/]+\/collections$/);
    await expect(
      mainWindow.getByRole('link', { name: 'Articles' })
    ).toBeHidden();
    await expect(mainWindow.getByText('No Collections found')).toBeVisible();
  });
});
