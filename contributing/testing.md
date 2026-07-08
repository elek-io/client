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

## Why the packaged build

Playwright's own Electron examples launch the source entry with the bundled dev binary, `electron.launch({ args: ['main.js'] })`. This project launches the packaged build instead. That is a deliberate choice. It runs what users actually run, so the tests cover the Content Security Policy, the custom `elek-io-local-file:` protocol and the electron-builder output layout, none of which a source launch exercises.

The cost is that tests only see a change after a rebuild, which is why the `pnpm test` scripts build first and CI builds before the suite. Iterating on test code alone with `pnpm exec playwright test` reuses the existing build (see [Running tests](#running-tests)).

Launching a packaged build shapes the fixture in two ways that differ from the Playwright examples:

- It finds the built executable with `parseElectronApp` from `electron-playwright-helpers` and passes it as `executablePath`, instead of relying on the dev binary in `node_modules`. This is the only reason that dependency is here.
- It passes no main script argument. A packaged build bundles and loads its own entry, so the argument is unnecessary. It was also a suspect in a Windows launch hang, so it is left off on purpose.

## How the fixtures work

Specs live in `tests/specs` and import `test` from [`tests/fixtures/electronApp.ts`](../tests/fixtures/electronApp.ts) instead of `@playwright/test`. The fixtures provide:

- `electronApp` launches the unpacked build for the current platform from `dist`.
- `mainWindow` is the app's first window as a Playwright `Page`.

The launch does a few important things:

- **Isolation**: each test gets its own empty data directories under its `test-results` output path, so tests never touch real user data and always start clean. Two stores are redirected: Core's project data via the `ELEK_IO_DATA_DIR` environment variable, which Core reads at startup (see Core's usage docs), and Electron's own userData (the Chromium profile, localStorage and caches) via Chromium's `--user-data-dir` launch switch, which Electron honors without any test-only code in the app. An earlier version redirected the OS home directory instead, but on Windows a redirected `USERPROFILE` stalls Electron's boot before Chromium starts, so these two targeted redirects are both cleaner and avoid that hang.
- **`NODE_ENV=test`**: both the main process and the renderer disable Sentry when they see this, so test runs do not report errors, traces or replays. A disabled Sentry client also never sets up its integrations, so profiling and replay stay dormant.
- **`ELECTRON_RUN_AS_NODE` is removed**: Electron based terminals like the one in VSCode set it, which would turn the launched app into a plain Node process and fail the launch with `Process failed to launch!`.

Playwright disables the Chromium sandbox on Linux itself (it adds `--no-sandbox` unless `chromiumSandbox: true`), so unpacked builds without the SUID sandbox helper run fine on GitHub's Ubuntu runners without the fixture passing anything.

When a test passes, the `mainWindow` fixture asserts that no console errors or warnings occurred and runs an axe accessibility scan, which does not assert on violations yet until the existing ones are resolved. The scan uses axe legacy mode, since otherwise axe opens a blank aggregation page via `context.newPage()`, which Electron does not support. Both checks are skipped when the test already failed, so they do not bury the real failure.

## Writing tests

Reusable page interactions belong in `tests/helpers` as plain functions that take the `Page` first. Prefer role and label based locators over CSS selectors, and auto-retrying assertions like `toHaveURL` over one-shot reads, since route redirects happen client side.

The `tests` folder is type-checked by `pnpm check-types:node` under the strictest settings. That config resolves modules with `nodenext`, so relative imports need explicit `.js` extensions, which Playwright resolves to the `.ts` files. `pnpm lint` also applies the type-aware ESLint rules to `tests`, so `no-floating-promises` flags an unawaited assertion, which type-checking alone does not catch.

## CI

CI builds and then runs the tests on the same four platforms as Core (Linux, Windows, macOS on Intel and ARM). Linux has no display server on the runners, so the tests run under `xvfb-run`. The Playwright HTML report is uploaded as an artifact for every run. When a test fails the raw `test-results` folder is uploaded too, which holds each failed test's Core data directory plus a runner-level trace on the retry (the step timeline, stdio and attachments). Playwright does not record screenshots or videos for Electron windows, nor DOM or network in the trace, since those come from its built-in browser fixtures, which these tests do not use.
