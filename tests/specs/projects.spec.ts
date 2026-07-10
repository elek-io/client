import { expect } from '@playwright/test';

import { test } from '../fixtures/electronApp.js';
import { createCollectionViaIpc } from '../helpers/collection.js';
import { confirmDialog } from '../helpers/dialog.js';
import { navigate, reloadWindow } from '../helpers/navigation.js';
import {
  createProject,
  createProjectViaIpc,
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
