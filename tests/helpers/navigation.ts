import { expect, type Page } from '@playwright/test';

export class NavigationHelper {
  constructor(private page: Page) {}

  /**
   * Navigate using the breadcrumb link by its name
   */
  async navigateBreadcrumbByName(name: string): Promise<void> {
    await this.page
      .getByLabel('breadcrumb')
      .getByRole('link', { name })
      .click();
  }

  /**
   * Get the current route (hash value)
   *
   * @returns The current hash route (e.g., '#/projects/123')
   */
  getCurrentRouteHash(): string {
    return new URL(this.page.url()).hash;
  }

  /**
   * Verify that the current route hash matches the expected hash
   *
   * Retries until the hash matches, since route redirects
   * like "/" to "/projects" happen client side
   */
  async verifyCurrentRouteHash(expectedHash: string): Promise<void> {
    await expect(this.page).toHaveURL((url) => url.hash === expectedHash);
  }
}
