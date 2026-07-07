import { expect } from '@playwright/test';

import { test } from '../fixtures/electronApp.js';
import { NavigationHelper } from '../helpers/navigation.js';

test.describe('App Initialization', () => {
  let navigationHelper: NavigationHelper;

  test.beforeEach(async ({ mainWindow }) => {
    navigationHelper = new NavigationHelper(mainWindow);
  });

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

    await navigationHelper.verifyCurrentRouteHash('#/projects');
  });
});
