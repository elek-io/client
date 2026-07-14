import { expect } from '@playwright/test';

import { IPC_CORE_ERROR_SENTINEL } from '../../src/shared/ipcError.js';
import { test } from '../fixtures/electronApp.js';
import { navigate, verifyCurrentRouteHash } from '../helpers/navigation.js';
import { setUserViaIpc } from '../helpers/user.js';

test.describe('Not found', () => {
  test('an unknown route renders the not-found screen', async ({
    mainWindow,
  }) => {
    // An unmatched hash is a normal router state (no thrown error), so this
    // stays console-clean and must NOT opt into the console allow-list, which
    // would mask a real regression.
    const unknownHash = '#/definitely-not-a-route';
    await navigate(mainWindow, unknownHash);

    // The NotFoundComponent renders: its title, the attempted href (from
    // `location.href`, which carries the hash), and the two recovery controls.
    await expect(
      mainWindow.getByRole('heading', { name: 'Not Found' })
    ).toBeVisible();
    await expect(mainWindow.getByText(unknownHash)).toBeVisible();
    await expect(
      mainWindow.getByRole('button', { name: 'Back to Projects' })
    ).toBeVisible();
    await expect(
      mainWindow.getByRole('button', { name: 'Reload' })
    ).toBeVisible();
  });
});

test.describe('Root error boundary', () => {
  test('a failed route read renders the error boundary and recovers', async ({
    mainWindow,
  }) => {
    await setUserViaIpc(mainWindow);

    // A project route with a non-existent id: the `projects.read` query
    // (throwOnError: true) fails and `useQueryNoError` re-throws it in render,
    // so the root ErrorComponent replaces the whole view. React Query retries
    // the read a few times first (~8s), so the boundary needs a longer wait.
    await navigate(
      mainWindow,
      '#/projects/00000000-0000-0000-0000-000000000000/dashboard'
    );
    await expect(
      mainWindow.getByRole('heading', { name: 'Error' })
    ).toBeVisible({ timeout: 20000 });

    // The desktop app shows a decoded message (via parseIpcError), never the raw
    // IPC sentinel JSON. The message is a plain `<p>` (no ARIA role), sitting
    // beside the developer stack `<pre>` which legitimately still carries the
    // encoded form, so scope the check to that paragraph, not the whole page.
    const errorMessage = mainWindow
      .getByRole('main')
      .locator('p')
      .filter({ hasNotText: 'Unfortunately' });
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).not.toContainText(IPC_CORE_ERROR_SENTINEL);

    // Recovery: Back to Projects returns to the Projects list and the app is
    // usable again (the empty state renders, since no Project was created).
    await mainWindow.getByRole('button', { name: 'Back to Projects' }).click();
    await verifyCurrentRouteHash(mainWindow, '#/projects');
    await expect(mainWindow.getByText('No Projects yet')).toBeVisible();
  });
});
