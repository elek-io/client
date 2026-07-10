import { expect, type Page } from '@playwright/test';

/**
 * Verify that the current route hash matches the expected hash
 *
 * Retries until the hash matches, since route redirects
 * like "/" to "/projects" happen client side
 */
export async function verifyCurrentRouteHash(
  page: Page,
  expectedHash: string
): Promise<void> {
  await expect(page).toHaveURL((url) => url.hash === expectedHash);
}

/**
 * Reload the renderer and wait for the app to remount.
 *
 * This reloads only the renderer, the main process and Core stay alive, so it
 * proves the renderer re-fetches persisted state from Core, not survival across
 * a full process restart.
 */
export async function reloadWindow(page: Page): Promise<void> {
  await page.reload();
  await expect(page.locator('#app')).toBeVisible();
}
