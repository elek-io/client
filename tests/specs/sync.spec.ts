import { expect } from '@playwright/test';

import { test } from '../fixtures/electronApp.js';
import {
  createCollectionViaIpc,
  referenceFieldDefinition,
  textFieldDefinition,
} from '../helpers/collection.js';
import { dismissDialog } from '../helpers/dialog.js';
import {
  createEntryViaIpc,
  referenceValue,
  stringValue,
} from '../helpers/entry.js';
import {
  createProjectViaIpc,
  navigateToProjectDashboard,
  setRemoteOriginUrlViaIpc,
} from '../helpers/project.js';
import {
  deleteEntryOnRemote,
  localWorkSha,
  remoteWorkSha,
  setupRemote,
} from '../helpers/remote.js';
import { setUserViaIpc } from '../helpers/user.js';

test.describe('Synchronize', () => {
  test('round-trips a local change to the remote and clears the ahead count', async ({
    mainWindow,
  }, testInfo) => {
    await setUserViaIpc(mainWindow);
    const project = await createProjectViaIpc(mainWindow);

    // Mirror the Project's current work branch into a bare origin, so it starts
    // level with the remote. clone --bare copies the refs without a working tree
    // or an LFS push, which a plain bare remote cannot serve.
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

    // One real local write moves work ahead of the remote by one commit, so
    // there is something to push.
    await createCollectionViaIpc(mainWindow, { projectId: project.id });

    // The sidebar's Synchronize control lives on Project routes and enables only
    // when there is something to sync (ahead 1 here).
    await navigateToProjectDashboard(mainWindow, project.id);
    const synchronize = mainWindow.getByRole('button', { name: 'Synchronize' });
    await expect(synchronize).toBeEnabled();

    // The commit the push should land on the remote. A pull that rebases onto an
    // ancestor is a no-op, so the local work SHA does not move during the sync.
    const expectedSha = localWorkSha(projectPath);

    await synchronize.click();

    // Corroborate the round-trip on the runner: the remote's work ref reaches the
    // local commit, proving the push landed, without inspecting file contents.
    // Poll until it arrives, since the sync (fetch, rebase, push) is in flight.
    await expect
      .poll(() => remoteWorkSha(remote.path), { timeout: 30000 })
      .toBe(expectedSha);

    // Sync resolved, so ahead/behind are back to zero and the button returns to
    // disabled. The button lives in the sidebar, so its still being there (rather
    // than gone with the whole view) also shows the sync did not hit the root
    // error boundary, and the fixture's console check backs that up.
    await expect(synchronize).toBeDisabled();
    await expect(mainWindow).toHaveURL(
      new RegExp(`#/projects/${project.id}/dashboard`)
    );
  });

  test('stops a sync that would orphan a reference and pushes nothing', async ({
    mainWindow,
  }, testInfo) => {
    await setUserViaIpc(mainWindow);
    const project = await createProjectViaIpc(mainWindow);

    // A Collection whose Entries can point at one another (an optional single
    // entry reference alongside the required title).
    const collection = await createCollectionViaIpc(mainWindow, {
      projectId: project.id,
      fieldDefinitions: [textFieldDefinition(), referenceFieldDefinition()],
    });

    // E2 references E1. Both are valid writes, so Core's write-time gate passes.
    // Core requires a value for the optional reference field even when it holds
    // no target, so E1 carries an empty reference.
    const target = await createEntryViaIpc(mainWindow, {
      projectId: project.id,
      collectionId: collection.id,
      values: {
        title: stringValue({ en: 'Target' }),
        related: referenceValue(),
      },
    });
    await createEntryViaIpc(mainWindow, {
      projectId: project.id,
      collectionId: collection.id,
      values: {
        title: stringValue({ en: 'Source' }),
        related: referenceValue(target.id, collection.id),
      },
    });

    // Mirror the current work (with both Entries and the reference) into a bare
    // origin, then point the Project at it.
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

    // Delete the reference target on the remote, out of band. This bypasses
    // Core's delete gate, so the remote's work tree now holds a dangling
    // reference (the Source Entry still points at the deleted Target).
    deleteEntryOnRemote(
      testInfo,
      remote.path,
      `collections/${collection.id}/${target.id}.json`
    );

    // A local commit so the histories diverge: now local is ahead by this Entry
    // and behind by the remote's delete commit.
    await createEntryViaIpc(mainWindow, {
      projectId: project.id,
      collectionId: collection.id,
      values: {
        title: stringValue({ en: 'Local only' }),
        related: referenceValue(),
      },
    });

    const beforeSha = remoteWorkSha(remote.path);

    await navigateToProjectDashboard(mainWindow, project.id);
    const synchronize = mainWindow.getByRole('button', { name: 'Synchronize' });
    await expect(synchronize).toBeEnabled();

    await synchronize.click();

    // The pull rebases the local Entry onto the remote (Target deleted), then the
    // pre-push integrity scan finds the dangling reference and rejects with a
    // Conflict without pushing. The desktop app surfaces that in place through the
    // sync-conflict modal, not the root error boundary (the fixture's console
    // check confirms no error escaped).
    await expect(
      mainWindow.getByText('Could not synchronize this Project')
    ).toBeVisible();
    // The description reflects the preserved CoreError type: the integrity gate
    // rejects with a Conflict, so the modal shows the remote-conflict reason
    // rather than the generic fallback.
    await expect(
      mainWindow.getByText(
        'A change on the remote conflicts with your local work, so nothing was pushed. Resolve it and try again.'
      )
    ).toBeVisible();

    // Nothing was pushed: the remote's work ref is exactly where it was, so the
    // local-only Entry never reached the shared remote.
    expect(remoteWorkSha(remote.path)).toBe(beforeSha);

    // Dismissing the modal leaves the app usable (not crashed or mid-rebase): the
    // dashboard and its sidebar still render.
    await dismissDialog(mainWindow);
    await expect(synchronize).toBeVisible();
    await expect(mainWindow).toHaveURL(
      new RegExp(`#/projects/${project.id}/dashboard`)
    );
  });
});
