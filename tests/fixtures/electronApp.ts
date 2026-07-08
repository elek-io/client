import { AxeBuilder } from '@axe-core/playwright';
import {
  test as base,
  type ElectronApplication,
  type Page,
  _electron as electron,
  expect,
} from '@playwright/test';
import { parseElectronApp } from 'electron-playwright-helpers';
import { existsSync } from 'node:fs';

/**
 * Returns the path to the unpacked build for the current platform
 *
 * Selected explicitly instead of using findLatestBuild,
 * since that picks whatever artifact was modified last and a full
 * "pnpm build" leaves installers in "dist" that are newer than
 * the unpacked directory
 */
function findUnpackedBuild(): string {
  const candidates = ['linux-unpacked', 'win-unpacked', 'mac-arm64', 'mac'];

  for (const candidate of candidates) {
    const path = `dist/${candidate}`;

    if (existsSync(path)) {
      return path;
    }
  }

  throw new Error(
    'No unpacked build found in "dist". Run "pnpm build" or the faster "pnpm build:unpack" first'
  );
}

/**
 * Custom fixtures for Electron E2E testing
 *
 * Tests run against the packaged build in "dist",
 * so run "pnpm build" or the faster "pnpm build:unpack" before testing
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
  electronApp: async ({}, use, testInfo) => {
    const appInfo = parseElectronApp(findUnpackedBuild());

    // Isolate both data stores per test, so tests start clean and never touch
    // real user data. Core reads ELEK_IO_DATA_DIR for its project data.
    // Electron's own userData (Chromium profile, localStorage, caches) is
    // redirected with Chromium's --user-data-dir switch below. Core and
    // Electron each create their directory, see testing.md
    const dataDir = testInfo.outputPath('elek-io-data');
    const userDataDir = testInfo.outputPath('electron-user-data');

    // Inherit the environment but skip undefined values,
    // since Playwright only accepts strings
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        env[key] = value;
      }
    }
    env['NODE_ENV'] = 'test';
    env['ELEK_IO_DATA_DIR'] = dataDir;
    // Electron based terminals like the one in VSCode set this variable,
    // which would turn the launched app into a plain Node process
    // and fail the launch with "Process failed to launch!"
    delete env['ELECTRON_RUN_AS_NODE'];

    // No main script argument on purpose, packaged builds load their bundled
    // app on their own. Playwright adds --no-sandbox on Linux itself, so
    // unpacked builds without the SUID sandbox helper run fine on CI
    const app = await electron.launch({
      executablePath: appInfo.executable,
      args: [`--user-data-dir=${userDataDir}`],
      env,
    });

    // Mirror the app's process output into the test output,
    // so initialization failures in the main process are visible
    app
      .process()
      .stdout?.on('data', (data: Buffer) =>
        console.log(`[app] ${data.toString().trimEnd()}`)
      );
    app
      .process()
      .stderr?.on('data', (data: Buffer) =>
        console.error(`[app] ${data.toString().trimEnd()}`)
      );

    // Use the app in tests
    await use(app);

    // Clean up - close the app after tests
    await app.close();
  },

  mainWindow: async ({ electronApp }, use, testInfo) => {
    // Wait for the first window to open. The timeout is below the test
    // timeout, so a window that never opens reports as a firstWindow
    // timeout instead of a less specific test timeout
    const window = await electronApp.firstWindow({ timeout: 20000 });

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

    // Only run teardown checks when the test body passed. On a failure the
    // window may be gone, so the axe scan would throw an unrelated error and
    // the console assertions would just pile onto the real failure
    if (testInfo.status !== testInfo.expectedStatus) {
      return;
    }

    // Run the accessibility scan so breakage of the axe integration
    // surfaces early, but do not assert on the violations yet.
    // Legacy mode is required, since otherwise axe opens a blank aggregation
    // page via context.newPage(), which Electron does not support
    // @todo Expect no violations once existing issues are resolved
    await new AxeBuilder({
      page: window,
    })
      .setLegacyMode()
      .analyze();

    // Fail on any console error or warning. A single assertion, so both lists
    // are visible when either is non-empty
    expect({ errors, warnings }).toEqual({ errors: [], warnings: [] });
  },
});
