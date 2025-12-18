import { expect, Page } from '@playwright/test';

import { SupportedLanguage, type CreateProjectProps } from '@elek-io/core';

import { NavigationHelper } from './navigation';

export class CrudHelper {
  private navigationHelper: NavigationHelper;
  constructor(private page: Page) {
    this.navigationHelper = new NavigationHelper(page);
  }

  async createProject(props: CreateProjectProps): Promise<void> {
    await this.navigationHelper.navigateBreadcrumbByName('Projects');
    await this.navigationHelper.verifyCurrentRouteHash('#/projects');
    await this.page.getByRole('button', { name: 'Create Project' }).click();

    // Fill in project details
    await this.page.getByLabel('Project name').fill(props.name);
    await this.page.getByLabel('Project description').fill(props.description);

    // Check default supported languages
    const currentSupportedLanguages: SupportedLanguage[] = [];
    for (const row of await this.page
      .getByLabel('Supported languages')
      .getByRole('listitem')
      .all()) {
      const supportedLanguage = await row.textContent();
      expect(supportedLanguage).toBeTruthy();

      if (supportedLanguage) {
        currentSupportedLanguages.push(supportedLanguage as SupportedLanguage);
      }
    }

    // Determine which supported languages to add and do so
    const supportedLanguagesToAdd = props.settings.language.supported.filter(
      (language) => currentSupportedLanguages.includes(language) === false
    );
    if (supportedLanguagesToAdd.length > 0) {
      await this.page.getByText('Add language').click();
      for (const language of supportedLanguagesToAdd) {
        await this.page
          .getByRole('combobox', {
            name: 'Search supported languages',
          })
          .fill(language);
        await this.page.getByRole('option', { name: language }).click();
      }
      await this.page.locator('body').press('Escape');
    }

    // Set default language if needed
    const currentDefaultLanguage = (await this.page
      .getByRole('combobox', { name: 'Default' })
      .textContent()) as SupportedLanguage;
    expect(currentDefaultLanguage).toBeTruthy();
    if (currentDefaultLanguage !== props.settings.language.default) {
      await this.page.getByRole('combobox', { name: 'Default' }).click();
      await this.page
        .getByRole('option', { name: props.settings.language.default })
        .click();
    }

    // Remove any unsupported languages
    const supportedLanguagesToRemove = currentSupportedLanguages.filter(
      (language) =>
        props.settings.language.supported.includes(language) === false
    );
    for (const language of supportedLanguagesToRemove) {
      await this.page
        .getByLabel('Supported languages')
        .getByText(language)
        .getByRole('button')
        .click();
    }

    // Submit the form
    await this.page.getByRole('button', { name: 'Create Project' }).click();
  }
}
