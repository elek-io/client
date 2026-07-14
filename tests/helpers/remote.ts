import { type TestInfo } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

/** The branch all content edits happen on (see Core's git-and-sync docs). */
const WORK_BRANCH = 'work';

/**
 * Create a local bare git repo to stand in for a Project's remote `origin`.
 *
 * This runs on the runner (Node side), not in the renderer, so it uses the
 * system `git` on PATH directly. The bare repo lives under the per-test output
 * path, so it is isolated and cleaned up with the rest of the test artifacts.
 *
 * Pass `mirror` with an existing repo path to seed the bare repo with a copy of
 * all its refs (`git clone --bare`), which produces an origin the Project starts
 * out level with. This avoids Core's LFS push path, which is not reliable over a
 * plain bare remote. Without `mirror` the bare repo starts empty.
 */
export function setupRemote(
  testInfo: TestInfo,
  options: { mirror?: string } = {}
): { path: string; url: string } {
  const path = testInfo.outputPath('remote-origin');
  mkdirSync(path, { recursive: true });

  if (options.mirror !== undefined) {
    // A bare clone copies every ref without a working tree or an LFS push
    execFileSync('git', ['clone', '--bare', options.mirror, path]);
  } else {
    execFileSync('git', ['init', '--bare', path]);
  }

  // Core (via dugite) accepts the absolute path as the origin URL directly
  return { path, url: path };
}

/**
 * Read the commit SHA of the `work` branch on a bare remote via `git ls-remote`.
 *
 * Runner-side corroboration for the sync specs: comparing this against the local
 * `work` SHA proves a round-trip actually reached the remote (P1-20), or that a
 * rejected sync pushed nothing (P1-21). This observes only the ref, not file
 * contents, so it stays within the desktop verification doctrine.
 */
export function remoteWorkSha(remotePath: string): string {
  const output = execFileSync('git', [
    'ls-remote',
    remotePath,
    `refs/heads/${WORK_BRANCH}`,
  ])
    .toString()
    .trim();
  const sha = output.split(/\s/)[0];
  if (sha === undefined || sha === '') {
    throw new Error(`No "${WORK_BRANCH}" ref found on remote "${remotePath}"`);
  }
  return sha;
}

/** Read the local `work` branch commit SHA of a Project's git repo. */
export function localWorkSha(dir: string): string {
  return execFileSync('git', ['-C', dir, 'rev-parse', WORK_BRANCH])
    .toString()
    .trim();
}

/**
 * Delete an Entry file directly on the bare remote, out of band, bypassing
 * Core's delete gate.
 *
 * Clones the bare to a throwaway working tree, removes the file on `work`,
 * commits, and pushes `work` back to the bare. This is how a test arranges a
 * remote whose `work` tree already holds a dangling reference (a reference whose
 * target was deleted on the remote), a state Core's own delete gate would never
 * allow, so a following local synchronize hits the sync-time integrity gate.
 */
export function deleteEntryOnRemote(
  testInfo: TestInfo,
  remotePath: string,
  relPath: string
): void {
  const workTree = testInfo.outputPath('remote-edit-clone');

  // No LFS objects are involved (Entry files are plain JSON), and skipping the
  // smudge filter keeps git-lfs from reaching for a remote it cannot serve.
  const env = { ...process.env, GIT_LFS_SKIP_SMUDGE: '1' };

  execFileSync('git', ['clone', remotePath, workTree], { env });
  execFileSync('git', ['-C', workTree, 'checkout', WORK_BRANCH], { env });
  execFileSync('git', ['-C', workTree, 'rm', relPath]);
  execFileSync('git', [
    '-C',
    workTree,
    // Identity is set inline so the runner needs no global git config
    '-c',
    'user.name=E2E Remote',
    '-c',
    'user.email=e2e-remote@example.com',
    'commit',
    '-m',
    `Delete ${relPath} out of band`,
  ]);
  execFileSync('git', ['-C', workTree, 'push', 'origin', WORK_BRANCH], { env });
}
