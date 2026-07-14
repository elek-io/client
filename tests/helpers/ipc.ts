import { expect, type ElectronApplication } from '@playwright/test';

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

/**
 * Replace a Core IPC handler so its next call rejects, to drive an unexpected
 * failure the app has no in-place handling for. Used to prove such a failure
 * reaches the root error boundary rather than an in-place dialog, which guards
 * the mutation's `throwOnError` predicate against a regression back to a blanket
 * `throwOnError: false` (see error-handling.md).
 *
 * Mirrors `stubFileDialog`: the app captures each handler by reference at
 * registration, so this removes the real one and registers a throwing
 * replacement in the main process. The thrown error is a plain `Error` and so
 * carries no `CoreError` type, which is exactly what the predicate treats as
 * unexpected and lets propagate. Scoped to the current test's app instance, so
 * it does not leak. Electron logs a handler throw to the main process console,
 * not the renderer, so the fixture's renderer console check is not tripped.
 */
export async function stubCoreReject(
  electronApp: ElectronApplication,
  channel: string
): Promise<void> {
  await electronApp.evaluate(({ ipcMain }, ch) => {
    ipcMain.removeHandler(ch);
    ipcMain.handle(ch, () => {
      throw new Error('E2E injected failure');
    });
  }, channel);
}
