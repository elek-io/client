import { expect } from '@playwright/test';

import { test } from '../fixtures/electronApp.js';
import { navigateToUserProfile, setUserViaIpc } from '../helpers/user.js';

test.describe('User profile', () => {
  test('first-run onboarding sets and persists the local User', async ({
    mainWindow,
  }) => {
    // Fresh app, no User yet.
    await navigateToUserProfile(mainWindow);

    // The first-run greeting shows while no User exists, and Save is gated until
    // the form is dirtied. Asserting the greeting first also proves the User
    // query resolved (to null), so the fieldset is no longer loading-disabled.
    await expect(
      mainWindow.getByRole('heading', { name: 'Welcome to elek.io Desktop' })
    ).toBeVisible();
    await expect(
      mainWindow.getByRole('button', { name: 'Save local User' })
    ).toBeDisabled();

    // Fill the identity. Port stays 31310 and the local-API Switch stays OFF, so
    // the API never starts (that side effect is P2-11's scope).
    const name = 'Ada Lovelace';
    await mainWindow.getByLabel('Full name').fill(name);
    await mainWindow.getByLabel('Email', { exact: true }).fill('ada@elek.io');

    // The "Example change" preview authors its commit from the name field, so the
    // typed name renders live in the preview (the input value itself is not text).
    await expect(mainWindow.getByText(name)).toBeVisible();

    // The form is dirty now, so Save enables. Saving navigates to the Projects list.
    await expect(
      mainWindow.getByRole('button', { name: 'Save local User' })
    ).toBeEnabled();
    await mainWindow.getByRole('button', { name: 'Save local User' }).click();
    await expect(mainWindow).toHaveURL(/#\/projects$/);

    // Persistence: reopening the profile reads the saved User (so no more Welcome
    // title), and the form reset shows the entered name.
    await navigateToUserProfile(mainWindow);
    await expect(
      mainWindow.getByRole('heading', { name: 'User profile' })
    ).toBeVisible();
    await expect(mainWindow.getByLabel('Full name')).toHaveValue(name);
  });

  test('edits an existing User and persists the change', async ({
    mainWindow,
  }) => {
    await setUserViaIpc(mainWindow, {
      name: 'Test User',
      email: 'test@elek.io',
    });
    await navigateToUserProfile(mainWindow);

    // With a User already set, the form reset from it (no Welcome title), shows
    // the existing name, and Save is gated until an edit dirties the form.
    await expect(
      mainWindow.getByRole('heading', { name: 'User profile' })
    ).toBeVisible();
    await expect(mainWindow.getByLabel('Full name')).toHaveValue('Test User');
    await expect(
      mainWindow.getByRole('button', { name: 'Save local User' })
    ).toBeDisabled();

    // Editing the name dirties the form, so Save enables. Saving navigates to
    // the Projects list. Whether the new identity reaches the git author is
    // Core's own test, so it is not asserted here.
    await mainWindow.getByLabel('Full name').fill('Renamed User');
    await expect(
      mainWindow.getByRole('button', { name: 'Save local User' })
    ).toBeEnabled();
    await mainWindow.getByRole('button', { name: 'Save local User' }).click();
    await expect(mainWindow).toHaveURL(/#\/projects$/);

    // Persistence: reopening the profile shows the renamed value.
    await navigateToUserProfile(mainWindow);
    await expect(mainWindow.getByLabel('Full name')).toHaveValue(
      'Renamed User'
    );
  });
});
