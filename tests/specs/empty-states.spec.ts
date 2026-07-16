import { expect } from '@playwright/test';

import { test } from '../fixtures/electronApp.js';
import {
  createCollectionViaIpc,
  navigateToCollection,
} from '../helpers/collection.js';
import { navigate, verifyCurrentRouteHash } from '../helpers/navigation.js';
import { createProjectViaIpc, navigateToAssets } from '../helpers/project.js';
import { setUserViaIpc } from '../helpers/user.js';

test.describe('Empty states', () => {
  // Pin all four app-wide empty strings in one place, walked in an order that
  // keeps each precondition true (project before assets, no collections before
  // the sidebar empty state, a collection before its empty entry table). This
  // is the single spot a renamed empty state is caught, so some overlap with
  // the projects and entries specs is intentional.
  test('renders each area empty state when its total is zero', async ({
    mainWindow,
  }) => {
    // 1. Fresh app: the Projects list is empty.
    await verifyCurrentRouteHash(mainWindow, '#/projects');
    await expect(mainWindow.getByText('No Projects yet')).toBeVisible();

    // 2. A project with no Assets shows the Assets empty state.
    await setUserViaIpc(mainWindow);
    const project = await createProjectViaIpc(mainWindow);
    await navigateToAssets(mainWindow, project.id);
    await expect(mainWindow.getByText('No Assets yet')).toBeVisible();

    // 3. The project has no Collections, so the sidebar shows its empty state.
    await navigate(mainWindow, `#/projects/${project.id}/collections`);
    await expect(mainWindow.getByText('No Collections found')).toBeVisible();

    // 4. A Collection with no Entries shows the entry table empty state.
    const collection = await createCollectionViaIpc(mainWindow, {
      projectId: project.id,
    });
    await navigateToCollection(mainWindow, {
      projectId: project.id,
      collectionId: collection.id,
    });
    await expect(mainWindow.getByText('No results.')).toBeVisible();
  });
});
