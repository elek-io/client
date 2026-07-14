import { test } from '../fixtures/electronApp.js';
import { expectNoAxeViolations } from '../helpers/accessibility.js';
import { navigate } from '../helpers/navigation.js';
import { setUserViaIpc } from '../helpers/user.js';

// Per-route accessibility assertions, opt-in ahead of the fixture-wide axe
// assertion the @todo still defers (see testing.md). Each route enforces every
// axe rule except the ones in `disableRules`, which scope out issues the route
// does not pass yet (an app-wide color-contrast issue). Add a route here once it
// is clean enough to enforce.
const enforcedRoutes: { hash: string; disableRules: string[] }[] = [
  // The Projects list (empty) passes every rule except the app-wide
  // color-contrast issue, so it is the first enforced route.
  { hash: '#/projects', disableRules: ['color-contrast'] },
];

test.describe('Accessibility', () => {
  for (const route of enforcedRoutes) {
    test(`has no axe violations on ${route.hash}`, async ({ mainWindow }) => {
      // A User keeps the app chrome in its normal state, matching what the scan
      // was validated against. The Projects list stays empty (no Project seeded).
      await setUserViaIpc(mainWindow);
      await navigate(mainWindow, route.hash);
      await expectNoAxeViolations(mainWindow, {
        disableRules: route.disableRules,
      });
    });
  }
});
