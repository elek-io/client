import { expect } from '@playwright/test';

import { test } from '../fixtures/electronApp.js';
import { createCollectionViaIpc } from '../helpers/collection.js';
import { confirmDialog } from '../helpers/dialog.js';
import {
  navigate,
  reloadWindow,
  verifyCurrentRouteHash,
} from '../helpers/navigation.js';
import {
  createProject,
  createProjectViaIpc,
  navigateToProjectSettings,
  setRemoteOriginUrlViaIpc,
} from '../helpers/project.js';
import { setupRemote } from '../helpers/remote.js';
import { setUserViaIpc } from '../helpers/user.js';

test.describe('Projects', () => {
  test('creates a project through the form and shows it in the list', async ({
    mainWindow,
  }) => {
    await setUserViaIpc(mainWindow);

    const name = 'My first Project';
    await createProject(mainWindow, {
      name,
      description: 'Created through the create form',
    });

    // Reaching the dashboard (asserted inside createProject) means Core
    // accepted the create without throwing. Core owns and separately tests
    // file and commit correctness, so this spec verifies only the desktop
    // app's part: the create reached Core, and the UI reflects the result.

    // Back on the Projects list, the new Project is shown
    await mainWindow
      .getByRole('link', { name: 'Projects', exact: true })
      .click();
    await expect(mainWindow).toHaveURL(/#\/projects$/);
    await expect(mainWindow.getByText(name)).toBeVisible();
  });

  test('renders a persisted project after a renderer reload', async ({
    mainWindow,
  }) => {
    await setUserViaIpc(mainWindow);
    const name = 'Seeded Project';
    await createProjectViaIpc(mainWindow, { name });

    // The list was fetched empty before the seed, so a reload is what surfaces
    // the persisted project. This proves the renderer reads Core's state on a
    // fresh load rather than showing an optimistic cache entry.
    await reloadWindow(mainWindow);
    await expect(mainWindow).toHaveURL(/#\/projects$/);
    await expect(mainWindow.getByText(name)).toBeVisible();
  });

  test('surfaces create validation on submit without disabling the button', async ({
    mainWindow,
  }) => {
    await setUserViaIpc(mainWindow);
    await navigate(mainWindow, '#/projects/create');

    // On open, the create is not submit-gated (validation is surfaced on click,
    // not by disabling the button) and no field is flagged invalid yet.
    await expect(
      mainWindow.getByRole('button', { name: 'Create Project' })
    ).toBeEnabled();
    await expect(mainWindow.getByLabel('Project name')).toHaveAttribute(
      'aria-invalid',
      'false'
    );
    await expect(mainWindow.getByLabel('Project description')).toHaveAttribute(
      'aria-invalid',
      'false'
    );

    // Submitting empty surfaces the errors on both required fields and the URL
    // stays on the create route, so the submit did not go through and nothing
    // was created. Whether the message text is Core's is Core's concern, the
    // desktop app's responsibility is to surface the invalid state and block.
    await mainWindow.getByRole('button', { name: 'Create Project' }).click();
    await expect(mainWindow.getByLabel('Project name')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    await expect(mainWindow.getByLabel('Project description')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    await expect(mainWindow).toHaveURL(/#\/projects\/create$/);
  });

  test('shows the empty state, then a card once a project exists', async ({
    mainWindow,
  }) => {
    // Fresh app with nothing seeded: the empty state shows and no card renders.
    await verifyCurrentRouteHash(mainWindow, '#/projects');
    await expect(mainWindow.getByText('No Projects yet')).toBeVisible();

    // Seeding a project (over IPC, which skips the renderer cache) and reloading
    // surfaces its card with both name and description, and the empty state goes.
    await setUserViaIpc(mainWindow);
    await createProjectViaIpc(mainWindow);
    await reloadWindow(mainWindow);

    await expect(mainWindow.getByText('Test Project')).toBeVisible();
    await expect(
      mainWindow.getByText('A Project created by the E2E tests')
    ).toBeVisible();
    await expect(mainWindow.getByText('No Projects yet')).toBeHidden();
  });

  test('updates a project through the form, gated on a dirty change', async ({
    mainWindow,
  }) => {
    await setUserViaIpc(mainWindow);
    const project = await createProjectViaIpc(mainWindow, {
      name: 'Test Project',
    });

    // Land on the settings form fresh, which reads the Project from Core
    await navigateToProjectSettings(mainWindow, project.id);

    // Wait for the form to reset from the loaded Project. Until it settles, the
    // dirty gate cannot be trusted, so key off the name field showing.
    await expect(mainWindow.getByLabel('Project name')).toHaveValue(
      'Test Project'
    );

    // Nothing edited yet, so Save is gated
    await expect(
      mainWindow.getByRole('button', { name: 'Save changes' })
    ).toBeDisabled();

    // Editing the name dirties the form, so Save enables
    await mainWindow.getByLabel('Project name').fill('Renamed Project');
    await expect(
      mainWindow.getByRole('button', { name: 'Save changes' })
    ).toBeEnabled();
    await mainWindow.getByRole('button', { name: 'Save changes' }).click();

    // A successful Project update stays on the settings page, so prove the
    // change persisted through a read surface: boot fresh on the Projects list,
    // which re-reads from Core, and see the renamed card with the old name gone.
    await navigate(mainWindow, '#/projects');
    await expect(mainWindow.getByText('Renamed Project')).toBeVisible();
    await expect(mainWindow.getByText('Test Project')).toBeHidden();
  });

  test('force-deletes a local-only project through the fallback modal', async ({
    mainWindow,
  }) => {
    await setUserViaIpc(mainWindow);
    const project = await createProjectViaIpc(mainWindow);

    await navigate(mainWindow, `#/projects/${project.id}/settings/general`);

    // A local-only Project can't be deleted normally, Core guards against
    // destroying unsynchronized work. The desktop app catches that rejection
    // and offers a force delete instead of crashing to the error boundary.
    await mainWindow.getByRole('button', { name: 'Delete Project' }).click();
    await confirmDialog(mainWindow, 'Delete');

    // The force-delete modal appears (the guard was handled in place)
    await expect(
      mainWindow.getByText('Force delete this Project?')
    ).toBeVisible();
    await confirmDialog(mainWindow, 'Yes, delete');

    // The force delete goes through and the UI reflects the removal
    await expect(mainWindow).toHaveURL(/#\/projects$/);
    await expect(mainWindow.getByText('No Projects yet')).toBeVisible();
  });

  test('routes a project with unpushed commits through the force-delete modal', async ({
    mainWindow,
  }, testInfo) => {
    await setUserViaIpc(mainWindow);
    const project = await createProjectViaIpc(mainWindow);

    // Mirror the Project's current work branch into a bare origin, so the
    // Project starts out level with its remote (ahead 0). clone --bare copies
    // the refs without a working tree, sidestepping Core's LFS push path.
    const projectPath = testInfo.outputPath(
      'elek-io-data',
      'projects',
      project.id
    );
    const remote = setupRemote(testInfo, { mirror: projectPath });
    await setRemoteOriginUrlViaIpc(mainWindow, {
      id: project.id,
      url: remote.url,
    });

    // One real local write moves work ahead of the remote, so a guarded delete
    // would now destroy unsynchronized work. This is the state that separates
    // this case from the local-only (no origin) force-delete above.
    await createCollectionViaIpc(mainWindow, { projectId: project.id });

    await navigate(mainWindow, `#/projects/${project.id}/settings/general`);

    // The unpushed-ahead guard is caught in place and offers a force delete,
    // rather than silently destroying the work or crashing to the error boundary.
    await mainWindow.getByRole('button', { name: 'Delete Project' }).click();
    await confirmDialog(mainWindow, 'Delete');

    await expect(
      mainWindow.getByText('Force delete this Project?')
    ).toBeVisible();
    await confirmDialog(mainWindow, 'Yes, delete');

    // The force delete goes through and the UI reflects the removal
    await expect(mainWindow).toHaveURL(/#\/projects$/);
    await expect(mainWindow.getByText('No Projects yet')).toBeVisible();
  });
});
