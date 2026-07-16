import { expect } from '@playwright/test';

import { test } from '../fixtures/electronApp.js';
import {
  apiIsRunningViaIpc,
  navigateToUserProfile,
  setUserViaIpc,
} from '../helpers/user.js';

test.describe('Local API lifecycle', () => {
  test('the profile Enabled toggle starts and stops the local API', async ({
    mainWindow,
    request,
  }) => {
    // A test-specific port keeps this spec independent of whatever the default
    // 31310 might be doing elsewhere.
    const port = 31310;
    const url = `http://localhost:${port}/content/v1/projects`;

    // Probe the API from the Node runner. Node requests carry no browser Origin,
    // so the API's localhost-only CORS does not block them (a renderer `fetch`
    // would be blocked). A closed port rejects the request, which we map to
    // 'refused'.
    const probe = async (): Promise<'serving' | 'refused'> => {
      try {
        const response = await request.get(url);
        return response.ok() ? 'serving' : 'refused';
      } catch {
        return 'refused';
      }
    };

    // Arrange: a User whose local-API preference is off, so nothing starts the
    // API (Core only records the flag, the desktop app acts on it).
    await setUserViaIpc(mainWindow, { localApi: { port, isEnabled: false } });
    expect(await apiIsRunningViaIpc(mainWindow)).toBe(false);

    // Act: toggle Enabled ON and save. `onSetUser` starts the API, then
    // navigates to the Projects list. The profile page has a single Switch.
    await navigateToUserProfile(mainWindow);
    const enabledToggle = mainWindow.getByRole('switch');
    await enabledToggle.click();
    await expect(enabledToggle).toBeChecked();
    await mainWindow.getByRole('button', { name: 'Save local User' }).click();
    await expect(mainWindow).toHaveURL(/#\/projects$/);

    // Assert: the desktop app drove the API lifecycle. It is running...
    expect(await apiIsRunningViaIpc(mainWindow)).toBe(true);
    // ...and actually serving content over HTTP.
    await expect.poll(probe).toBe('serving');

    // Act: toggle Enabled OFF and save. `onSetUser` stops the running API.
    await navigateToUserProfile(mainWindow);
    await expect(enabledToggle).toBeChecked();
    await enabledToggle.click();
    await expect(enabledToggle).not.toBeChecked();
    await mainWindow.getByRole('button', { name: 'Save local User' }).click();
    await expect(mainWindow).toHaveURL(/#\/projects$/);

    // Assert: it is stopped and the port refuses connections. Poll the port,
    // since the OS may lag releasing it after the server closes.
    expect(await apiIsRunningViaIpc(mainWindow)).toBe(false);
    await expect.poll(probe).toBe('refused');
  });
});
