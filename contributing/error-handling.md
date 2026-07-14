# Error Handling

This is the single reference for how elek.io Desktop handles errors end to end: where they come from, how a `CoreError` keeps its meaning across the IPC boundary, how errors surface in the UI, where and when things are logged both locally and to Sentry, and how to handle a specific expected error in place. For what the errors themselves mean (the `CoreError` types and when Core raises them), read Core's own [error-handling doc](../node_modules/@elek-io/core/docs/error-handling.md).

## Where errors come from

Two kinds of error reach the renderer, and the difference drives everything below.

- **`CoreError`** is thrown by a Core operation and travels to the renderer through an IPC channel. It is the app's expected failure shape. Core raises a `CoreError` with a `type` (`NotFound`, `BadRequest`, `Unauthorized`, `Conflict`, `PreconditionFailed`, `UpgradeFailed`, `Internal`) and a matching `statusCode`. The `type` is the stable, machine readable contract, like an HTTP status code. See Core's [error-handling doc](../node_modules/@elek-io/core/docs/error-handling.md) for the full table.
- **Renderer errors** are ordinary JavaScript or React errors: a route that fails to load, a render that throws, a bug. These are not `CoreError`s and carry no `type`.

## Preserving `CoreError.type` across IPC

The main and renderer processes are separate, so an error thrown by a handler does not travel to the renderer as itself. Electron reconstructs it on the renderer side, and that reconstruction **drops the `CoreError` subclass along with its `type` and `statusCode`, and carries no stack frames** (verified: the renderer-side rejection is a plain `Error` whose `message` is `Error invoking remote method '<channel>': <original message>` and whose `stack` has zero `at ...` frames). Without help the renderer sees only a message string, cannot tell a `Conflict` from a `PreconditionFailed`, and has no origin stack.

To keep all three, the main and renderer sides cooperate through one small cross process module, [`src/shared/ipcError.ts`](/src/shared/ipcError.ts). It imports `CoreErrorType` type only, so it carries no runtime dependency on Core and bundles into both processes.

1. **Encode in main.** The single `ipcMain.handle` wrapper in [`src/main/index.ts`](/src/main/index.ts) (the one loop that registers every channel) try/catches the handler call. A thrown `CoreError` is re-thrown as `new Error(serializeCoreError(error.type, error.message, error.stack))`, which packs the `type`, message and Core's own origin `stack` into the message behind a sentinel string. Anything that is not a `CoreError` propagates unchanged.
2. **Decode in the renderer.** `parseIpcError(error)` returns `{ type?, message, stack? }`. It finds the sentinel by substring, so it is robust to Electron prefixing the message, validates the decoded `type` against the known `CoreErrorType` values, and returns the clean message plus Core's stack. For a non `CoreError`, or a malformed payload, it returns just the raw message and `type`/`stack` are absent.

Because the sentinel is located by substring and the type is validated, decoding never throws and always degrades to the raw message. This is why the renderer can safely call `parseIpcError` on any caught value, `CoreError` or not.

The `stack` is what powers a readable Sentry event (see [Sentry](#sentry-remote)). It matters because the reconstructed renderer error is frameless, so without forwarding, a CoreError that reaches Sentry would carry no stack at all.

## How errors surface in the UI

### Unexpected errors: the root error boundary

By default, query and mutation failures are meant to be fatal to the current view. `throwOnError: true` is set app wide, by [`useQueryNoError`](/src/renderer/hooks/useQueryNoError.ts) for queries and by `customMutationOptions` ([`util.ts`](/src/renderer/queries/util.ts)) for mutations. The error is re-thrown during render and caught by the only `errorComponent` in the app, the root `ErrorComponent` in [`__root.tsx`](/src/renderer/routes/__root.tsx). It replaces the whole view with a friendly error page whose only exits are Back to Projects and Reload.

`ErrorComponent` runs the caught error through `parseIpcError`, so it shows and logs the clean message and never the raw sentinel payload. It keeps the original `stack` in the technical detail block.

This full view takeover is the right default for an unexpected error but the wrong response to an expected, recoverable one. Those are handled in place instead.

### Expected errors: handled in place

Some `CoreError`s are raised by normal user actions and are recoverable. A `409`/`412` guard on a delete or a sync is not a crash, it is information the user can act on. For those, a mutation opts out of the boundary at its call site and drives the UI itself. See the guide below.

## Handling expected errors in place

Follow this recipe when a specific Core guard should stay on the page instead of hitting the boundary.

1. **Opt out of the boundary at the call site.** Override the mutation with `throwOnError: false`, so the failure does not reach the boundary, and `onError: () => {}`, so the wrapper's global error toast and log do not fire.
2. **Await inside try/catch.** `await mutateAsync(...)` still rejects on failure regardless of `throwOnError`, so the `catch` runs.
3. **Capture and drive the UI.** In the `catch`, store the error in state and open a controlled `Dialog` through `useState`.
4. **Decode the reason.** Read `const { type } = parseIpcError(error)`.
5. **Map the type to copy.** Use `describeCoreError(type, overrides?, fallback?)` from [`lib/coreErrorText.ts`](/src/renderer/lib/coreErrorText.ts). A matching per type `override` wins, then the consumer's `fallback` (its own generic sentence), then an app wide generic per type, then a default for an unknown type. These components use hardcoded English today, so the maps are plain strings. When i18n lands, `describeCoreError` is the single seam that maps `type` to a localized string.

Keep dialog titles and button labels stable, since the E2E specs assert them. Only the description changes with the `type`. Assert the copy you wrote in specs, never Core's raw message, which belongs to Core's own tests.

An error handled this way is intentionally invisible to the standard logging and to Sentry (see [Logging](#logging-where-what-and-when)). Only the in place UI reacts. If you also want such an error tracked, log it explicitly in the `catch`.

### Example: sync conflict

[`components/project-sidebar.tsx`](/src/renderer/components/project-sidebar.tsx) catches a failed `synchronize`, most notably Core's sync time integrity gate rejecting a rebase that would push a dangling reference. The Synchronize mutation sets `throwOnError: false` and a no-op `onError`. The `onClick` catches the rejection, stores it with `setSyncError(error)`, and opens the "Could not synchronize this Project" dialog. The dialog description calls `describeCoreError` with a small overrides map (`Conflict` explains the remote conflict, `PreconditionFailed` explains the remote could not be reached) and the previous generic sentence as the fallback. The title stays generic, so it still covers an LFS or network failure, while the description is now reason specific.

### Example: force delete a Project

[`settings/general.tsx`](/src/renderer/routes/projects/$projectId/settings/general.tsx) catches Core's delete guard. A normal delete of a local only Project (`PreconditionFailed`) or one with unpushed commits (`Conflict`) is blocked. The delete mutation uses the same `throwOnError: false` and no-op `onError` override. The `catch` stores the error and opens the "Force delete this Project?" dialog, whose description uses `describeCoreError` to explain why the normal delete was blocked (`PreconditionFailed` says the Project only exists on this device, `Conflict` says it has unpushed changes). Confirming re-issues the delete with `{ force: true }`. The `onForceDelete` failure toast also runs through `describeCoreError`.

## Logging: where, what, and when

The app logs to two independent sinks. Do not confuse them.

- **Core logger (local).** `window.ipc.core.logger.*` sends over the `core:logger:*` IPC channels to Core's own logger, which writes to the console and to Core's log files. This is local diagnostics and is always on, including under test.
- **Sentry (remote).** Error, tracing, profiling and session replay events sent to sentry.io. Sentry is initialized twice, once per process, both at 100% sampling. Both inits are disabled when `NODE_ENV=test`, so test runs never report. A disabled Sentry client also never sets up its integrations.

### Local logging (Core logger)

| When                                     | Where                                                                               | What                                                |
| ---------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------- |
| Every route navigation                   | `router.subscribe('onBeforeLoad')` in [`renderer/index.ts`](/src/renderer/index.ts) | info: "Desktop navigating from ... to ..."          |
| A mutation succeeds                      | `customMutationOptions` onSuccess ([`util.ts`](/src/renderer/queries/util.ts))      | info: "Successfully ...ed ..." plus a success toast |
| A mutation fails (not handled in place)  | `customMutationOptions` onError                                                     | error: "Failed to ..." plus an error toast          |
| An error reaches the root boundary       | `ErrorComponent` in [`__root.tsx`](/src/renderer/routes/__root.tsx)                 | error: "Uncaught route error: {decoded message}"    |
| A React error not caught by any boundary | `onUncaughtError` in [`app.tsx`](/src/renderer/app.tsx)                             | error: "Uncaught React error"                       |
| Main process security events             | main handlers in [`src/main/index.ts`](/src/main/index.ts)                          | error: blocked external or internal navigation      |

### Sentry (remote)

**Main process** ([`src/main/index.ts`](/src/main/index.ts), `@sentry/electron/main`):

- Automatic capture of uncaught exceptions and unhandled rejections in the main process, through the SDK's default integrations.
- Manual `captureException` at: app initialization failure (followed by a `flush` and `app.exit(1)`), a blocked external navigation, a blocked internal navigation, the custom file protocol running without Core, and a file requested from outside the Projects directory. The two navigation cases also write a local Core logger error.

**Renderer process** ([`src/renderer/index.ts`](/src/renderer/index.ts), `@sentry/electron/renderer` plus `@sentry/react`):

- Automatic capture of unhandled errors and rejections, plus tracing, profiling and session replay integrations.
- React root error handlers wired in [`app.tsx`](/src/renderer/app.tsx) through `reactErrorHandler`: `onUncaughtError` (also logs locally), `onCaughtError` (the usual path, since the root boundary catches query, mutation and route errors), and `onRecoverableError`.

**Readable `CoreError`s in Sentry.** Both inits share a `beforeSend` hook, `decodeCoreErrorForSentry` from [`src/shared/sentryCoreError.ts`](/src/shared/sentryCoreError.ts). When a captured error carries a serialized `CoreError`, it rewrites the message to the readable form, relabels the exception `Error` as `CoreError`, adds a `core_error_type` tag for filtering, and **rebuilds the stacktrace from Core's forwarded origin stack**. It is a no-op for any other event. This reuses the same `parseIpcError` decode the UI uses, so Sentry and the UI agree.

Rebuilding the stack matters because, as noted above, the reconstructed renderer error is frameless, so an unmodified CoreError event would carry no stack at all. The renderer's `beforeSend` passes Sentry's own `defaultStackParser` (from `@sentry/react`) into `decodeCoreErrorForSentry`, which parses Core's forwarded stack string into `exception.values[0].stacktrace.frames`. The helper stays free of any Sentry import by taking the parser as an argument (typed generically), so it still bundles into both processes. The main-process init passes no parser, since a `CoreError` is returned over IPC and never captured in main.

**Symbolicating the Core frames to TypeScript.** The rebuilt frames point at Core's shipped build (`@elek-io/core/.../index.node.mjs`). Sentry resolves them to Core's original TypeScript source through a Sentry **release plus artifact path** match, since Core is externalized from our build and carries no Sentry debug id, so the debug-id flow the Sentry Vite plugin uses for our own bundles does not cover it.

Three pieces line up to make the match, all of them our side only (Core needs no change, its node map already embeds its original sources):

1. **One release name.** [`electron.vite.config.ts`](../electron.vite.config.ts) builds `desktop@<version>` from the app version, injects it into both bundles as `__APP_RELEASE__`, and passes it to the Sentry Vite plugin. Both SDK inits set it as their `release`, so every event is tagged with it.
2. **Core's map uploaded to that release.** A CD step uploads Core's `dist/node` source map to the same release under the stable artifact name `~/node_modules/@elek-io/core/dist/node/index.node.mjs` (see [releasing.md](./releasing.md#sentry-source-maps)). It runs on the Linux runner only, since Core's map is identical on every platform.
3. **Frame paths normalized to match.** The rebuilt frame's runtime path varies per platform and install (`file:///.../app.asar/node_modules/@elek-io/core/dist/node/index.node.mjs`), so [`sentryCoreError.ts`](/src/shared/sentryCoreError.ts) rewrites any frame pointing at Core's node build to the canonical `app:///node_modules/@elek-io/core/dist/node/index.node.mjs`. Sentry matches that against the uploaded `~/` artifact and resolves the frame to Core's `.ts`.

If a Core frame stops resolving, the usual cause is one of these three drifting: the release name, the upload url-prefix, or the normalized path. `CORE_NODE_BUILD` in [`sentryCoreError.ts`](/src/shared/sentryCoreError.ts) is the single source of truth, and `pnpm check` runs a guard ([`scripts/check-sentry-symbolication.mjs`](../scripts/check-sentry-symbolication.mjs)) that fails if the CD upload or the release name drift from it, or if Core changes where it ships its node build. So a mismatch is a red check at review time, not a silent failure in production. Symbolication is purely additive regardless, so a frame still shows `index.node.mjs` with its line and column even when the match fails.

**What is not sent to Sentry.** An expected error handled in place (`throwOnError: false` plus a no-op `onError`) never reaches the React error handlers, so it produces no Sentry event and no standard toast or log. That is intended.

### What one unexpected mutation failure produces

A single failed mutation that is not handled in place fans out on purpose:

1. A `toast.error` from the wrapper's `onError`.
2. A local Core logger error "Failed to ..." from the same `onError`, carrying the mutation meta.
3. `throwOnError` re-throws into the root boundary, so `ErrorComponent` writes a second local Core logger error "Uncaught route error: ..." with the decoded message and stack.
4. React's `onCaughtError` sends one Sentry event, decoded and tagged by `beforeSend`.

The two local logs are not a bug. They carry different context, the mutation meta and the fatal route surface, and both help when reading a session's logs.

## Testing implications

The E2E fixture asserts zero console errors or warnings on a passing test (see [testing.md](./testing.md)). Because an unexpected failure reaches the root boundary, which logs through `console.error` and `core:logger:error`, a UI driven negative path that hits the boundary needs the console escape hatch. A flow handled in place never reaches the boundary and never trips the assertion, which is one reason the expected error pattern above is preferred for recoverable guards. Assert the reason specific copy you wrote, not Core's raw message.

## Quick reference

| Scenario                              | UI surface                       | Local log                                            | Sentry                              |
| ------------------------------------- | -------------------------------- | ---------------------------------------------------- | ----------------------------------- |
| Unexpected query error                | Root error boundary              | Boundary error log                                   | Yes (`onCaughtError`)               |
| Unexpected mutation error             | Root error boundary              | Wrapper error log plus boundary error log, one toast | Yes (`onCaughtError`)               |
| Expected `CoreError` handled in place | Dialog or toast on the same page | None by default                                      | No                                  |
| Route not found                       | `NotFoundComponent`              | None                                                 | No                                  |
| Main process security block           | Denied, no window                | Core logger error                                    | Yes (`captureException`)            |
| App init failure                      | App exits                        | console.error only                                   | Yes (`captureException` then flush) |
