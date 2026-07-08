# E2E Testing

The client is tested end to end with [Playwright](https://playwright.dev/docs/api/class-electron) driving the packaged Electron app. Playwright labels its Electron support experimental, but it is the best fit for this project. It runs over the Chrome DevTools Protocol, Microsoft tests VS Code through the same path, and breakages with new Electron versions have historically been fixed within days. The main alternative, [WebdriverIO's electron service](https://webdriver.io/docs/desktop-testing/electron), is listed first in [Electron's testing docs](https://www.electronjs.org/docs/latest/tutorial/automated-testing) and would be the fallback if Playwright's Electron support ever goes away. Only the small launch surface in the fixture is Playwright-Electron specific, so the specs themselves would port.

There is no unit test setup yet. Everything below is about E2E tests.

## Running tests

Tests run against the unpacked build in `dist`. The test scripts build it first, so they always test the current code:

```sh
pnpm test           # build unpacked, then run all tests
pnpm test:ui        # build unpacked, then open Playwright's UI mode
pnpm test:debug     # build unpacked, then run with the Playwright inspector
pnpm test:report    # open the HTML report of the last run
```

When iterating on test code only, skip the rebuild by invoking the runner directly:

```sh
pnpm exec playwright test
```

CI does the same, since its build step already produced the packaged app. Note that reruns inside UI or debug mode also do not rebuild, only the initial invocation does.

## How the fixtures work

Specs live in `tests/specs` and import `test` from [`tests/fixtures/electronApp.ts`](../tests/fixtures/electronApp.ts) instead of `@playwright/test`. The fixtures provide:

- `electronApp` launches the unpacked build for the current platform from `dist`.
- `mainWindow` is the app's first window as a Playwright `Page`.

The launch does a few important things:

- **Isolation**: each test gets its own empty Core data directory inside `test-results` via the `ELEK_IO_DATA_DIR` environment variable, which Core reads at startup (see Core's usage docs). Tests never touch real user data and always start from a clean state. An earlier version redirected the OS home directory instead, but on Windows a redirected `USERPROFILE` stalls Electron's boot before Chromium starts, so isolating only Core's data is both cleaner and avoids that hang.
- **`NODE_ENV=test`**: both the main process and the renderer disable Sentry when they see this, so test runs do not report errors, traces or replays.
- **`ELECTRON_RUN_AS_NODE` is removed**: Electron based terminals like the one in VSCode set it, which would turn the launched app into a plain Node process and fail the launch with `Process failed to launch!`.
- **`--no-sandbox` on Linux CI only**: GitHub's Ubuntu runners restrict unprivileged user namespaces and unpacked builds lack the SUID sandbox helper.

After each test the `mainWindow` fixture asserts that no console errors or warnings occurred. An axe accessibility scan also runs on every test, but does not assert on violations yet until the existing ones are resolved.

## Writing tests

Reusable page interactions belong in `tests/helpers`. Prefer role and label based locators over CSS selectors, and auto-retrying assertions like `toHaveURL` over one-shot reads, since route redirects happen client side.

The `tests` folder is type-checked by `pnpm check-types:node` under the strictest settings. That config resolves modules with `nodenext`, so relative imports need explicit `.js` extensions, which Playwright resolves to the `.ts` files.

## CI

CI builds and then runs the tests on the same four platforms as Core (Linux, Windows, macOS on Intel and ARM). Linux has no display server on the runners, so the tests run under `xvfb-run`. The Playwright HTML report is uploaded as an artifact for every run, and the raw `test-results` folder (screenshots, videos, traces) when tests fail.
