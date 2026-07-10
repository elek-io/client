import { type TestInfo } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

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
