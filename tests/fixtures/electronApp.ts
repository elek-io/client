import {
  test as base,
  type ElectronApplication,
  type Page,
  _electron as electron,
  expect,
} from '@playwright/test';
import { findLatestBuild, parseElectronApp } from 'electron-playwright-helpers';

/**
 * Custom fixtures for Electron E2E testing
 */
export const test = base.extend<{
  /**
   * The Electron application instance
   */
  electronApp: ElectronApplication;

  /**
   * The main window of the Electron app
   */
  mainWindow: Page;
}>({
  // eslint-disable-next-line no-empty-pattern
  electronApp: async ({}, use) => {
    const latestBuild = findLatestBuild('dist');
    const appInfo = parseElectronApp(latestBuild);

    // Launch Electron app
    const app = await electron.launch({
      executablePath: appInfo.executable,
      args: [appInfo.main],
      // Enable debugging in CI
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    });

    // Use the app in tests
    await use(app);

    // Clean up - close the app after tests
    await app.close();
  },

  mainWindow: async ({ electronApp }, use) => {
    // Wait for the first window to open
    const window = await electronApp.firstWindow();

    const errors: string[] = [];
    const warnings: string[] = [];

    // Listen for console errors and warnings
    window.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    // Use the window in tests
    await use(window);

    // After each test, check for console errors and warnings
    expect(errors).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  },
});
