import { AxeBuilder } from '@axe-core/playwright';
import {
  test as base,
  type ElectronApplication,
  type Page,
  type TestInfo,
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
 * Launch the unpacked build for the current platform.
 *
 * Extracted from the `electronApp` fixture so a spec can relaunch against the
 * same data directory to test survival across a process restart (see
 * `relaunchApp`). The data stores are isolated per test: Core's project data via
 * ELEK_IO_DATA_DIR (read at startup, see testing.md) and Electron's own userData
 * (Chromium profile, localStorage, caches) via Chromium's --user-data-dir switch,
 * which Electron honors without any test-only code in the app. Both default to
 * the per-test output path, overridable to reuse a dir across a relaunch.
 */
export async function launchApp(
  testInfo: TestInfo,
  overrides: { dataDir?: string; userDataDir?: string } = {}
): Promise<ElectronApplication> {
  const appInfo = parseElectronApp(findUnpackedBuild());

  const dataDir = overrides.dataDir ?? testInfo.outputPath('elek-io-data');
  const userDataDir =
    overrides.userDataDir ?? testInfo.outputPath('electron-user-data');

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

  return app;
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

  /**
   * Console messages a spec expects and tolerates, matched against the errors
   * and warnings the `mainWindow` teardown asserts on. A collected message is
   * allowed when it includes one of the string `patterns` or matches one of the
   * RegExp `patterns`; only the remainder must be empty.
   *
   * `patterns` defaults to `[]`, so every existing spec stays strict (no message
   * is tolerated). A spec opts in with
   * `test.use({ allowedConsoleErrors: { patterns: [...] } })`, keeping the list
   * tight so unrelated regressions still fail.
   *
   * The patterns are wrapped in an object rather than passed as a bare array on
   * purpose: Playwright reads an array-valued option override as its own
   * `[value, options]` fixture tuple when the second element is an object, so a
   * bare `[/a/, /b/]` (or any array with a RegExp at index 1) would silently
   * collapse to its first element. An object override is never mistaken for
   * that tuple. See tests/fixtures/electronApp.ts history for the experiment.
   */
  allowedConsoleErrors: { patterns: (string | RegExp)[] };
}>({
  allowedConsoleErrors: [{ patterns: [] }, { option: true }],

  // eslint-disable-next-line no-empty-pattern
  electronApp: async ({}, use, testInfo) => {
    const app = await launchApp(testInfo);

    // Use the app in tests
    await use(app);

    // Clean up - close the app after tests. A spec that relaunches (see
    // relaunchApp) closes this app itself first, so tolerate an already-closed
    // app rather than failing teardown on a double close
    try {
      await app.close();
    } catch {
      // Already closed by the test, nothing to clean up
    }
  },

  mainWindow: async ({ electronApp, allowedConsoleErrors }, use, testInfo) => {
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

    // A relaunch spec closes the first app (and this window) during the body to
    // restart against the same data dir. The relaunched window is out of scope
    // for these checks, so skip them rather than scanning a closed page
    if (window.isClosed()) {
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

    // Fail on any console error or warning, minus the messages a spec opted to
    // tolerate via `allowedConsoleErrors`. A message is allowed when it includes
    // an allowed substring or matches an allowed RegExp. A single assertion, so
    // both remaining lists are visible when either is non-empty
    const isAllowed = (message: string): boolean =>
      allowedConsoleErrors.patterns.some((pattern) =>
        typeof pattern === 'string'
          ? message.includes(pattern)
          : pattern.test(message)
      );
    const remainingErrors = errors.filter((message) => !isAllowed(message));
    const remainingWarnings = warnings.filter((message) => !isAllowed(message));

    expect({
      errors: remainingErrors,
      warnings: remainingWarnings,
    }).toEqual({ errors: [], warnings: [] });
  },
});
