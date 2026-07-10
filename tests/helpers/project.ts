import { expect, type Page } from '@playwright/test';

import type { CreateProjectProps, Project } from '@elek-io/core';

const defaultProjectProps: CreateProjectProps = {
  name: 'Test Project',
  description: 'A Project created by the E2E tests',
  settings: {
    language: {
      default: 'en',
      supported: ['en'],
    },
  },
};

/**
 * Create a Project directly over IPC, bypassing the UI.
 *
 * Use this to arrange a precondition a test depends on but does not itself
 * verify. To exercise the create flow through the form, use `createProject`.
 */
export async function createProjectViaIpc(
  page: Page,
  overrides: Partial<CreateProjectProps> = {}
): Promise<Project> {
  const props: CreateProjectProps = { ...defaultProjectProps, ...overrides };
  return page.evaluate(async (p) => window.ipc.core.projects.create(p), props);
}

/** Fill the visible fields of the Project form. */
export async function fillProjectForm(
  page: Page,
  props: { name: string; description: string }
): Promise<void> {
  await page.getByLabel('Project name').fill(props.name);
  await page.getByLabel('Project description').fill(props.description);
}

/**
 * Create a Project through the form and wait for the redirect to its dashboard.
 * Starts from the Projects list, where the create flow begins, and returns the
 * new Project's id parsed from the resulting route.
 */
export async function createProject(
  page: Page,
  props: { name: string; description: string }
): Promise<string> {
  // Open the create form from the Projects list
  await page.getByRole('button', { name: 'Create Project' }).click();
  await expect(page).toHaveURL(/#\/projects\/create/);

  await fillProjectForm(page, props);

  // Submit. create navigates to /projects/{id}, which redirects to the dashboard
  await page.getByRole('button', { name: 'Create Project' }).click();
  await expect(page).toHaveURL(/#\/projects\/[^/]+\/dashboard/);

  const hash = new URL(page.url()).hash;
  const id = hash.split('/')[2];
  if (id === undefined) {
    throw new Error(`Expected a project id in the route, got "${hash}"`);
  }
  return id;
}
