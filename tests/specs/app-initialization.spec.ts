import { expect } from '@playwright/test';

import { test } from '../fixtures/electronApp';

test.describe('App Initialization', () => {
  test('should be able to launch the app successfully', async ({
    electronApp,
    mainWindow,
  }) => {
    // Verify Electron app instance exists
    expect(electronApp).toBeTruthy();

    // Verify main window exists
    expect(mainWindow).toBeTruthy();

    // Verify window is visible
    await expect(mainWindow.locator('#app')).toBeVisible();

    // Verify title contains app name
    await expect(mainWindow).toHaveTitle(/^elek\.io/);

    // Get current URL hash
    const hash = await mainWindow.evaluate(() => window.location.hash);

    // Verify we're on the projects page (or root which redirects to projects)
    expect(hash === '#/projects').toBe(true);
  });
});
