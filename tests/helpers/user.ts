import { type Page } from '@playwright/test';

import type { SetUserProps, User } from '@elek-io/core';

// SetUserProps is a local | cloud union. The tests only ever set a local User,
// so overrides target that branch to keep the userType discriminant intact.
type LocalUserProps = Extract<SetUserProps, { userType: 'local' }>;

/**
 * Set a local User over IPC.
 *
 * Core stamps the git author from the current User, so a User must exist
 * before any write. This talks to `window.ipc` directly through
 * `page.evaluate`, which runs in the renderer where the bridge is exposed.
 */
export async function setUserViaIpc(
  page: Page,
  overrides: Partial<LocalUserProps> = {}
): Promise<User> {
  const props: LocalUserProps = {
    userType: 'local',
    name: 'Test User',
    email: 'test@elek.io',
    language: 'en',
    localApi: {
      port: 31310,
      isEnabled: false,
    },
    ...overrides,
  };

  return page.evaluate(async (user) => window.ipc.core.user.set(user), props);
}
