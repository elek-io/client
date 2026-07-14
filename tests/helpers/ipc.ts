import { expect } from '@playwright/test';

/**
 * Assert that an IPC call rejects.
 *
 * Playwright's `expect` has no `.rejects` matcher (that is Jest), so await the
 * promise inside a try/catch and assert it threw. The `ViaIpc` helpers run their
 * `window.ipc` call inside `page.evaluate`, so a rejected IPC call rejects the
 * helper's promise, which this observes. Awaiting the rejection here (rather than
 * letting it surface through a UI mutation) keeps it off the renderer console, so
 * the fixture's console assertion is not tripped.
 *
 * This deliberately asserts only that the call threw, not the error's code, cause
 * or message. Core owns and tests its error contract; the desktop suite observes
 * only throw / no-throw for a guard with no UI path (see testing.md).
 */
export async function expectRejects(promise: Promise<unknown>): Promise<void> {
  let threw = false;
  try {
    await promise;
  } catch {
    threw = true;
  }
  expect(threw).toBe(true);
}
