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

/**
 * Navigate to a route by its hash and wait for the app to render there.
 *
 * The renderer uses hash based routing, so pointing the URL at the target hash
 * and reloading boots the app fresh on that route. Booting fresh matters for
 * arranged state, since an IPC seed does not touch the renderer's query cache,
 * so the route refetches from Core on this load. `goto` only sets the fragment
 * (a same-document navigation), the following `reload` is what boots fresh.
 */
export async function navigate(page: Page, hash: string): Promise<void> {
  const base = page.url().split('#')[0];
  await page.goto(`${base}${hash}`);
  await page.reload();
  await expect(page.locator('#app')).toBeVisible();
  await verifyCurrentRouteHash(page, hash);
}
