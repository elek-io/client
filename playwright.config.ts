import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for Electron E2E testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/specs',
  // A single Electron app instance runs at a time
  workers: 1,
  reporter: 'html',
  // Matches Playwright's default. Pinned so the relationship to the fixture's
  // 20s firstWindow timeout, which must stay below it, stays visible
  timeout: 30000,

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env['CI'],

  // Retry on CI only
  retries: process.env['CI'] ? 2 : 0,

  // Keep only failed tests' output. Passed tests' output, including their
  // per-test Core data directory, is deleted so it does not pile up on disk
  // or in the CI failure artifact
  preserveOutput: 'failures-only',

  use: {
    // Collect a trace when retrying a failed test. For Electron this is the
    // runner-level trace (step timeline, stdio, attachments) only, since
    // Playwright does not trace the Electron window's DOM, screencast or
    // network. Screenshot and video options are omitted because Playwright
    // only captures those for its built-in browser fixtures, which these
    // Electron tests do not use. @see https://playwright.dev/docs/trace-viewer
    trace: 'on-first-retry',
  },
});
