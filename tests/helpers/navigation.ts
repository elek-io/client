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
  async getCurrentRouteHash(): Promise<string> {
    return await this.page.evaluate(() => window.location.hash);
  }

  /**
   * Verify that the current route hash matches the expected hash
   */
  async verifyCurrentRouteHash(expectedHash: string): Promise<void> {
    const currentHash = await this.getCurrentRouteHash();

    expect(currentHash).toBe(expectedHash);
  }
}
