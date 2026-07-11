import { expect } from '@playwright/test';

import { test } from '../fixtures/electronApp.js';
import {
  createCollectionViaIpc,
  navigateToCollection,
} from '../helpers/collection.js';
import {
  createEntryViaIpc,
  fillEntryForm,
  navigateToEntryCreate,
  navigateToEntryUpdate,
  stringValue,
} from '../helpers/entry.js';
import { reloadWindow } from '../helpers/navigation.js';
import { createProjectViaIpc } from '../helpers/project.js';
import { setUserViaIpc } from '../helpers/user.js';

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
});
