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
