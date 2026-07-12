# E2E Test Backlog — @elek-io/desktop

## 1. Intro and prioritization principle

The app has exactly one spec today (`tests/specs/app-initialization.spec.ts`: launch, `#app` visible, title, `/ → #/projects`). Everything else — projects/collections/entries/assets CRUD, git history, sync, settings, user profile, i18n — is untested. This backlog turns the full route × IPC surface into concrete, independently implementable Playwright cases against the **packaged** build.

**Two grounding facts every case is built on:**

1. **Core is only reachable from the renderer through `window.ipc.core.<service>.<method>(...)`** (verified in `src/preload/index.ts`; every method forwards via `ipcRenderer.invoke` to a handler in `src/main/index.ts`). Seeding a precondition goes through typed `page.evaluate` wrappers over `window.ipc`, not the UI.
2. **Tests run against the packaged build with a per-test `ELEK_IO_DATA_DIR`**, so every test starts from empty, isolated data. The suite drives and observes the desktop app; it does not read Core's files back to re-check them, see the verification doctrine next.

**Verification doctrine.** Desktop tests verify only the desktop app's own responsibilities (it drives Core correctly, throw / no-throw is observed, the UI reflects the result), not Core's file, commit or validation correctness, which Core tests itself. This doctrine has a permanent home in [`testing.md`](./testing.md#what-a-desktop-test-verifies); every assertion below follows it.

**The app's error contract (drives every negative-path case).** All mutations use `customMutationOptions`, which sets `throwOnError: true` (`src/renderer/queries/util.ts:72`). On failure two independent things happen: `onError` fires `toast.error(...)` (and logs via `core:logger:error`), and separately `throwOnError: true` re-throws in the render phase. Because only `__root.tsx` defines an `errorComponent`, that re-throw replaces the whole view with the **root** error screen, so a failed UI mutation never "stays on the originating page." **Note (see section 5):** this full-view takeover is under review for expected, recoverable errors, and a decision has been made to move those to in-place handling. UI mutation-negative specs that assert the root `ErrorComponent` are therefore deferred; IPC-level negatives and happy-path specs are unaffected and proceed now.

**Prioritization principle (rank order):**

- **P0 — core data lifecycle / data-loss guards.** Create + delete + persistence for projects/collections/entries, git-commit correctness, and the two `project.delete` destruction guards (no-origin 412, unpushed-ahead 409). A bug here means silent data loss or corruption of the primary content objects, or destruction of unsynchronized commits.
- **P1 — the rest of CRUD + content integrity + sync.** Update flows, the collection-update schema cascade (rename/remove/narrow/non-deterministic + resolutions retry), write-time reference integrity, assets (two-file model), synchronize round-trip **and its dangling-reference integrity gate**, list/read states.
- **P2 — settings, user identity, uniqueness, history, navigation guards, local API, i18n/locale, multi-language content.**
- **P3 — validation edges, empty/error states, asset view/validation, table pagination, accessibility.**

Within a tier, cases are ordered by how foundational the flow is: set a user before any write, create a project before anything inside it, a collection before entries, and so on. Each case names the helpers it needs; the reusable helpers live in section 4 and should be built before their first consumer.

**Infra prerequisites this backlog exposes (build these first — see section 4):**

- **Launch race, fixed in the app (not a test concern).** The main process used to register its `window.ipc` handlers only after loading the renderer (`onAppReady` in `src/main/index.ts`), so a freshly opened window could run a `ViaIpc` seed before the handlers existed and flake with "No handler registered". `onAppReady` now creates the window, registers the handlers, then loads the renderer, which closed the race for every seed-first spec (and for real launches). See the Application Lifecycle section in [`overview.md`](./overview.md). No test-side readiness wait is needed.
- The per-test data dir is computed inside the fixture and never exported. Surface it (`dataDir(testInfo)` / `readDataFile` / `listDataDir`) so specs can assert Core's storage layout.
- **Console escape hatch is a prerequisite for _every_ UI-driven negative-path spec, not just the error-boundary case.** The `mainWindow` fixture asserts zero console errors/warnings on pass (`electronApp.ts:150`). Because failed mutations hit the root error boundary, React logs the caught error to `console.error` and the app logs via `core:logger:error`. Add an opt-in expected-console allow-list before writing P1-13, P2-09, or any UI-driven failing create/update/delete that reaches the error boundary. A flow that handles the error in place instead (like P0-11's force-delete modal, which overrides `throwOnError: false` and suppresses the toast) never reaches the boundary and needs no hatch. IPC-level negatives that `await` a rejected promise inside `page.evaluate` (P0-08, P1-04, P1-05, P1-06, P1-09, P1-10, P2-03, P2-10) do **not** trip this either.
- **Native `electron:dialog:*` modals must be stubbed in the MAIN process,** not the renderer. `contextBridge.exposeInMainWorld` freezes the exposed `window.ipc`, and the dialog calls forward to Electron's `dialog.showOpenDialog/showSaveDialog` in main. The stub is applied with `electronApp.evaluate(({ dialog }) => …)`. This affects every asset flow (P1-12, P1-15, P1-16, P3-06, P3-08).
- **A controllable git origin (`setupRemote`)** — a local bare repo — is needed for synchronize/clone/getChanges and the two `project.delete` remote guards.

## 2. Coverage matrix / gap summary

Existing coverage (the one spec): app launch, `#app` visible, title, `/ → /projects` redirect, plus the implicit per-pass checks (zero console errors/warnings; axe scan runs but does not assert). Everything marked "gap" is uncovered.

| IPC channel                                                                  | Existing coverage       | Backlog IDs                                          |
| ---------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------- |
| projects:create                                                              | gap                     | P0-01, P0-02, P0-09, P2-03, P3-01 (done)             |
| projects:list / count                                                        | gap                     | P0-01, P1-17 (done), P1-19, P3-07 (done)             |
| projects:read                                                                | gap                     | P0-02, P2-06                                         |
| projects:history                                                             | gap                     | P0-09, P2-06, P2-07                                  |
| projects:update                                                              | gap                     | P1-01 (done), P2-04                                  |
| projects:delete                                                              | gap                     | P0-11 (done), P0-08 (done), P0-10(indirect)          |
| projects:getChanges                                                          | partial (via sidebar)   | P1-20 (done), P2-05, P2-13                           |
| projects:setRemoteOriginUrl                                                  | partial                 | P0-08 (done), P2-05, P1-20 (done), P2-13             |
| projects:synchronize                                                         | partial                 | P1-20 (done), P1-21 (done), P2-13                    |
| projects:clone                                                               | gap                     | P2-12                                                |
| collections:list                                                             | gap                     | P0-03, P1-18 (done), P3-07 (done)                    |
| collections:create                                                           | gap                     | P0-03                                                |
| collections:read                                                             | gap                     | P0-03, P0-06                                         |
| collections:update                                                           | gap                     | P1-02, P1-03, P1-04, P1-05, P1-06, P1-11 (done)      |
| collections:delete                                                           | gap                     | P0-06                                                |
| entries:list                                                                 | gap                     | P0-04, P1-18 (done), P3-07 (done)                    |
| entries:create                                                               | gap                     | P0-04, P1-10, P2-15, P3-05 (done), P3-06(ref), P2-10 |
| entries:read                                                                 | gap                     | P0-05, P1-08                                         |
| entries:update                                                               | gap                     | P1-07 (done), P1-08                                  |
| entries:delete                                                               | gap (no UI; IPC-only)   | P1-09                                                |
| assets:list                                                                  | gap                     | P1-12, P3-07 (done)                                  |
| assets:create                                                                | gap                     | P1-12                                                |
| assets:read                                                                  | gap                     | P1-12, P1-16, P3-08                                  |
| assets:update                                                                | gap                     | P1-15, P3-06                                         |
| assets:delete                                                                | gap                     | P1-13, P1-14                                         |
| assets:save                                                                  | gap                     | P1-16                                                |
| user:get / set                                                               | gap                     | P2-01, P2-02, P2-03 (setUser helper)                 |
| api:start / stop / isRunning                                                 | gap                     | P2-11                                                |
| logger:*                                                                     | indirect only           | (exercised via P2-09; no dedicated case)             |
| electron:dialog:showOpen/showSave                                            | native, stubbed in main | P1-12, P1-15, P1-16, P3-06, P3-08                    |
| i18n / date-fns locale rendering                                             | gap                     | P2-14                                                |
| App launch / title / `/`→`/projects`                                         | **covered**             | —                                                    |
| Redirect chains ($projectId→dashboard, $entryId→update, settings/user index) | gap                     | P2-08                                                |
| Root not-found + error boundary                                              | gap                     | P2-09                                                |
| Global chrome (versions, back/forward, breadcrumbs)                          | gap                     | P3-10                                                |

## 3. Prioritized backlog

> **Assertion migration in progress.** These entries were first written before the verification doctrine (section 1) was settled, so many still describe on-disk `*.json` and commit-trailer assertions. Those are Core's tests, not the desktop's. As each test is implemented, its assertions are re-cast to the doctrine: drive via UI, observe throw / no-throw, assert the UI reflects the result. P0-01 through P0-06 have been migrated and are the reference; the wording of the others will be updated as they are picked up.

### P0 — core data lifecycle and data-loss guards

- **P0-01 Create a project through the form and show it in the list. — DONE (passing, `tests/specs/projects.spec.ts`).**
  Steps: `setUserViaIpc` → open the create form from the Projects list → fill name + description → Create.
  Assert (desktop-only, per the doctrine): the create reaches Core without throwing, shown by the redirect to `/projects/$id/dashboard`; the UI reflects it, shown by navigating back to the Projects list and seeing the new Project's card. Core's file/commit correctness is Core's test, not asserted here.
  Helpers: `setUserViaIpc`, `createProject`/`fillProjectForm`.
  Deps: none.

- **P0-02 Renders a persisted project after a renderer reload. — DONE (passing, `tests/specs/projects.spec.ts`).**
  Steps: `setUserViaIpc` → `createProjectViaIpc` → `reloadWindow` → assert the card is visible on the Projects list.
  Assert (desktop-only): the renderer reads Core's persisted state on a fresh load, shown by the seeded Project's card appearing after reload. `page.reload()` reloads only the renderer (main process and Core stay alive), so this proves renderer re-fetch over IPC, not survival across a full process restart (that is P0-10).
  Helpers: `setUserViaIpc`, `createProjectViaIpc`, `reloadWindow`.
  Deps: P0-01 helpers.

- **P0-03 Create a collection with a field definition through the form. — DONE (passing, `tests/specs/collections.spec.ts`).**
  Steps: `setUserViaIpc` + `createProjectViaIpc` → `navigateToCollectionCreate` → `fillCollectionForm` (name plural/singular, description, dual slugs) → `addFieldDefinition` (a required text field via the "Add Field" sheet) → Create Collection.
  Assert (desktop-only, per the doctrine): the create reaches Core without throwing, shown by the redirect to the new Collection's detail route; the UI reflects it, shown by the Collection appearing in the Collections sidebar by its plural name. Core's file/commit correctness and the field definition's persisted shape are Core's tests, not asserted here.
  Helpers: `setUserViaIpc`, `createProjectViaIpc`, `fillCollectionForm`, `addFieldDefinition`, `createCollection`, `navigateToCollectionCreate`.
  Deps: P0-01.

- **P0-04 Create an entry through the form and show it in the table. — DONE (passing, `tests/specs/entries.spec.ts`).**
  Steps: `setUserViaIpc` + `createProjectViaIpc` + `createCollectionViaIpc(required text)` → `navigateToEntryCreate` → `fillEntryForm` → Create.
  Assert (desktop-only): the create reaches Core without throwing, shown by the redirect to the Collection detail; the UI reflects it, shown by the new Entry's row rendering in the `EntryTable` with the value that was entered. Core's file/commit correctness (objectType, slug-keyed values, trailers) is Core's test.
  Helpers: `createCollectionViaIpc`, `fillEntryForm`, `navigateToEntryCreate`.
  Deps: P0-03.

- **P0-05 Renders a persisted entry after a renderer reload. — DONE (passing, `tests/specs/entries.spec.ts`).**
  Steps: `setUserViaIpc` + `createProjectViaIpc` + `createCollectionViaIpc` + `createEntryViaIpc` → `navigateToCollection` (the Entry list) → `reloadWindow` → assert the Entry's row is visible.
  Assert (desktop-only): the renderer reads Core's persisted state on a fresh load, shown by the seeded Entry's row appearing after reload. Same renderer-only caveat as P0-02 (`page.reload()` reloads only the renderer, main + Core stay alive), so this proves renderer re-fetch over IPC, not process-restart survival (that is P0-10).
  Helpers: `createCollectionViaIpc`, `createEntryViaIpc`, `stringValue`, `navigateToCollection`, `reloadWindow`.
  Deps: P0-04.

- **P0-06 Delete a collection and remove it from the UI. — DONE (passing, `tests/specs/collections.spec.ts`).**
  Steps: `setUserViaIpc` + `createProjectViaIpc` + `createCollectionViaIpc` + `createEntryViaIpc` → `navigateToCollectionSettings` → Delete Collection → `confirmDialog`.
  Assert (desktop-only): the delete reaches Core without throwing, shown by the redirect to the Collections list; the UI reflects it, shown by the Collection being gone from the sidebar and the "No Collections found" empty state showing. The cascade that removes the Collection's Entries is Core's behavior and Core's test; the desktop suite observes only that the Collection (and thus any way to reach its Entries) is gone from the UI.
  Helpers: `createCollectionViaIpc`, `createEntryViaIpc`, `stringValue`, `confirmDialog`, `navigateToCollectionSettings`.
  Deps: P0-04.

- **P0-07 — DROPPED. An IPC-level delete-guard test duplicates Core.**
  A first version asserted that `core.projects.delete` rejects without `force`. That is Core's own guard logic, covered by Core's own tests, so under the verification doctrine it does not belong in the desktop suite. The desktop-relevant behavior (the app catches that rejection and offers a force delete rather than crashing) is covered by **P0-11**. The bare throw / no-throw IPC observation is only appropriate for a guard with no UI path; project delete has one, the force-delete modal.

- **P0-08 `project.delete` unpushed-ahead guard routes a project with unpushed commits through the force-delete modal. — DONE (passing, `tests/specs/projects.spec.ts`).**
  Steps: `setUserViaIpc` + `createProjectViaIpc` → `setupRemote({ mirror: <project path> })` (a bare clone of the Project's current `work`, so it starts level, ahead 0) → `setRemoteOriginUrlViaIpc` → `createCollectionViaIpc` (one real local write, so `work` is now ahead of the remote) → settings/general → Delete Project → confirm → the force-delete modal appears → confirm force.
  Assert (desktop-only, per the doctrine): the unpushed-ahead guard is caught in place (the force-delete modal appears rather than the root error boundary or a silent destruction), and confirming force navigates to `/projects` where the empty state shows. This is distinct from P0-11 (local-only / 412) by its precondition: real unsynced work (409). Core's guard logic and file removal are Core's own tests.
  **Framing decision: UI-primary (not the IPC alternative).** The desktop app has a real UI path for this guard (the same force-delete modal as P0-11), so the doctrine prefers driving it through the UI over a bare throw / no-throw IPC observation. The empirical check that the arrangement leaves `work` ahead by one commit (`getChanges` → `ahead` length 1, `behind` empty, and a guarded delete rejecting `Conflict(409)`) was confirmed with a scratch probe and then removed; the spec asserts no counts (those are Core's).
  Helpers: `setupRemote`, `createProjectViaIpc`, `setRemoteOriginUrlViaIpc`, `createCollectionViaIpc`, `confirmDialog`, `navigate`.
  Deps: P0-11, `setupRemote`.

- **P0-09 Git commit trailers and author are correct across object types.**
  Steps: `setUser` (known name/email) → create project, collection, entry via UI → `getHistory`.
  Assert: each commit carries the right `Method`/`Object-Type`/`Object-Id`; the entry commit adds `Collection-Id`; ordering is newest-first; author matches the configured user.
  Helpers: `setUser`, `createProjectViaUi`, `addFieldDefinition`, `fillEntryForm`, `getHistory`.
  Deps: P0-01, P0-03, P0-04.

- **P0-10 True cross-process-restart persistence. — DONE (passing, `tests/specs/persistence.spec.ts`).**
  Steps: `setUserViaIpc` + `createProjectViaIpc` + `createCollectionViaIpc` + `createEntryViaIpc` on the first window → `relaunchApp` (close and relaunch `electronApp` against the same `ELEK_IO_DATA_DIR` and userData dir) → on the new window assert the seeded Project's card renders on `/projects`, then `navigateToCollection` and assert the seeded Entry's row renders.
  Assert (desktop-only): content survives a full main-process + Core restart, not just a renderer reload (contrast P0-02/P0-05, where `reloadWindow` keeps main + Core alive). Core's file correctness is Core's test.
  Helpers: `relaunchApp` (reuses the recorded per-test dir), `createCollectionViaIpc`, `createEntryViaIpc`, `stringValue`, `navigateToCollection`.
  Deps: P0-05, `relaunchApp`.

- **P0-11 Force-deletes a local-only project through the fallback modal. — DONE (passing, `tests/specs/projects.spec.ts`).**
  Steps: `setUserViaIpc` + `createProjectViaIpc` (local-only) → navigate to settings/general → Delete Project → confirm the first dialog → the force-delete modal appears → confirm force.
  Assert (desktop-only): the guarded delete is handled in place (the force-delete modal appears rather than the root error boundary), and confirming force navigates to `/projects` where the empty state shows. Core's guard logic and file removal are Core's own tests.
  Helpers: `setUserViaIpc`, `createProjectViaIpc`, `navigate`, `confirmDialog`.
  Deps: P0-01. The Desktop force-delete modal now exists in `general.tsx`: the delete mutation overrides `throwOnError: false` and suppresses the wrapper toast, so the guard rejection is caught and turned into the modal. No console escape hatch needed.

### P1 — rest of CRUD, content integrity, assets, sync

- **P1-01 Update a project is dirty-gated and persists. — DONE (passing, `tests/specs/projects.spec.ts`).**
  Steps: `setUserViaIpc` + `createProjectViaIpc({ name: 'Test Project' })` → `navigateToProjectSettings` → wait for the form to settle (name field shows 'Test Project') → assert "Save changes" DISABLED → edit the name to 'Renamed Project' → assert ENABLED → Save.
  Assert (desktop-only, per the doctrine): the Save button is gated on `formState.isDirty` (disabled until the name is edited); the update reaches Core without throwing; a successful Project update stays on the settings page, so persistence is proven through a read surface, booting fresh on the Projects list (which re-reads from Core) and seeing the renamed card with the old name gone. Core's file and commit correctness are Core's tests, not asserted here.
  Helpers: `setUserViaIpc`, `createProjectViaIpc`, `navigateToProjectSettings`, `navigate`.
  Deps: P0-01.

- **P1-02 `collection.update` rename-by-id preserves entry data (IPC).**
  Steps: seed collection(text `title`) + entry(value) → `ipc('core.collections.update')` with the same field id but slug `heading`.
  Assert: entry value moved to `heading` with content preserved; one commit covers `collection.json` + entry.
  Helpers: `seedCollection`, `seedEntry`, `ipc`, `dataDir`, `getHistory`.
  Deps: P0-04.

- **P1-03 `collection.update` remove-field drops exactly that value (IPC).**
  Steps: seed collection(fields A,B) + entry(both) → update removing B by id.
  Assert: A preserved; B gone from the entry; single commit; nothing else changed.
  Helpers: `seedCollection`, `seedEntry`, `ipc`, `dataDir`.
  Deps: P0-04.

- **P1-04 Non-deterministic schema change fails `missing_required` with Conflict and rolls back (IPC).**
  Steps: seed collection + entry → update adding a required field with no default → expect `Conflict(409)` whose cause lists `missing_required`.
  Assert: `collection.json` and the entry unchanged on disk; history length unchanged (atomic rollback).
  Helpers: `seedCollection`, `seedEntry`, `ipc`, `dataDir`, `getHistory`.
  Deps: P0-04.

- **P1-05 `collection.update` other non-deterministic issue types + resolutions-map retry (IPC).** _(added)_
  Steps: seed collection + entries that will collide → drive each of `type_mismatch`, `constraint_violation`, and `unique_collision` as `Conflict(409)` causes → then re-issue the update with a `resolutions` map keyed by `entryId → fieldSlug` and assert it completes and rewrites the affected entries.
  Assert: each issue type surfaces its own cause; the documented recovery path (retry with resolutions) actually unblocks the change and produces one commit.
  Helpers: `seedCollection`, `seedEntry`, `ipc`, `dataDir`, `getHistory`.
  Deps: P1-04. (Confirm the exact `resolutions` shape against Core docs before writing.)

- **P1-06 `collection.update` narrowing a reference field silently strips now-disallowed refs (IPC).** _(added — distinct from P1-03)_
  Steps: seed collection with a reference field allowing collections {A,B} + an entry referencing a B target → update the field to `ofCollections`/`ofComponents` = {A} only.
  Assert: the B reference is silently removed from the entry (permanent, silent data loss path); A-scoped references preserved; single commit.
  Helpers: `seedCollection`, `seedEntry`, `ipc`, `dataDir`.
  Deps: P1-03.

- **P1-07 Update an entry is dirty-gated and persists. — DONE (passing, `tests/specs/entries.spec.ts`).**
  Steps: `setUserViaIpc` + `createProjectViaIpc` + `createCollectionViaIpc` + `createEntryViaIpc({ values: { title: stringValue({ en: 'Original title' }) } })` → `navigateToEntryUpdate` → wait for the form to settle (Title field shows 'Original title') → assert "Update Article" DISABLED → edit the Title to 'Edited title' via `fillEntryForm` → assert ENABLED → Update.
  Assert (desktop-only): the Update button is gated on `formState.isDirty`; the update reaches Core without throwing, shown by the redirect to the Collection detail; the UI reflects the result, shown by the EntryTable row rendering 'Edited title' with 'Original title' gone (same UI-observation style as P0-04). Core's file and commit correctness are Core's tests.
  Helpers: `setUserViaIpc`, `createProjectViaIpc`, `createCollectionViaIpc`, `createEntryViaIpc`, `stringValue`, `navigateToEntryUpdate`, `fillEntryForm`.
  Deps: P0-04.

- **P1-08 Entry update back-fills defaults for fields added after creation.**
  Steps: seed collection(A) + entry(A=x) → `ipc` add optional field B (with default) to the collection → open `entry/update`.
  Assert: A prefilled `x`, B shows its default → save → entry has A=x and B=default (no loss of A).
  Helpers: `seedCollection`, `seedEntry`, `ipc`, `dataDir`.
  Deps: P1-07.

- **P1-09 `entry.delete` reference guard and success (IPC-only; no UI path).**
  Steps: seed collection with an entry-reference field, entries E1 and E2 where E2 references E1 → `ipc` delete E1 rejects `Conflict(409)` with `ReferencingEntry[]` naming E2, E1 still on disk → delete E2, then E1 succeeds and the file is gone.
  Helpers: `seedCollection`, `seedEntry`, `ipc`, `dataDir`.
  Deps: P0-04.

- **P1-10 Entry write-time reference integrity: broken reference rejected (IPC).** _(moved up from P3-06 — content-integrity gate)_
  Steps: `ipc('core.entries.create')` with a reference to a non-existent id.
  Assert: `BadRequest(400)` `Entry contains invalid references` (`reference_not_found`); no file written.
  Helpers: `seedCollection`, `ipc`, `dataDir`.
  Deps: P0-03.

- **P1-11 Update a collection is dirty-gated and persists. — DONE (passing, `tests/specs/collections.spec.ts`).**
  Steps: `setUserViaIpc` + `createProjectViaIpc` + `createCollectionViaIpc` → `navigateToCollectionSettings` → wait for the form to settle (plural name shows 'Articles') → assert "Save changes" DISABLED → rename the plural name to 'Guides' and edit the description (leave the slugs untouched, a slug change is the schema-cascade flow and out of scope) → assert ENABLED → Save.
  Assert (desktop-only): the Save button is gated on `formState.isDirty`; the update reaches Core without throwing, shown by the redirect to the collection detail; a reload proves the rename persisted (re-read from Core, not an optimistic cache entry), shown by the sidebar listing the Collection under its new plural name 'Guides'. The sidebar link is scoped to the sidebar (a complementary landmark) so the matching breadcrumb crumb on the detail page does not make the locator ambiguous. Core's file and commit correctness are Core's tests.
  **Gate-fix note.** The original entry described this Save button as having NO isDirty gate and asked to pin that asymmetry. That asymmetry was a bug, not intended behavior, and is now fixed (`update.tsx` gates on `updateCollectionForm.formState.isDirty`, so collection update matches project and entry). The field-definition array is tracked in `isDirty` (adding or removing a field via the "Add Field" sheet flips the gate), so the gate does not block a legitimate field-only edit. See the app-wide dirty-gate convention in [`loading-and-updating-data.md`](./renderer/loading-and-updating-data.md).
  Helpers: `setUserViaIpc`, `createProjectViaIpc`, `createCollectionViaIpc`, `navigateToCollectionSettings`, `reloadWindow`.
  Deps: P0-03.

- **P1-12 Create an asset keeps binary and sidecar in lockstep.**
  Steps: `seedProject` → `makeTempFile` (png) → assets route → `stubFileDialog({ open → temp })` (**applied in main**) → Add Asset → fill name/description → submit.
  Assert: `assets/{id}.json` (slugified name e.g. `my-logo`, derived mime/extension/size) and `lfs/{id}.{ext}` both exist; teaser appears; create commit.
  Helpers: `stubFileDialog`, `makeTempFile`, `seedProject`, `dataDir`.
  Deps: P0-01, `stubFileDialog`.

- **P1-13 Deleting a referenced asset is blocked.** _(split: IPC guard writable now, UI presentation deferred with the error-UX track)_
  IPC now (stable): seed project + collection(asset field) + asset + entry referencing it → `ipc('core.assets.delete', …)` rejects `Conflict`; asset json + binary + the referencing entry are all intact. No console hatch needed.
  UI (deferred): teaser Delete → `confirmDialog`. Today this surfaces the root `ErrorComponent`; once expected errors are handled in place, re-assert against the new behavior (toast, stays on the assets route). Do not write the UI half until the error-UX track lands (section 5).
  Helpers: `seedCollection`, `seedEntry`, `stubFileDialog`, `confirmDialog`, `expectToast`, `dataDir`, console escape hatch (UI half only).
  Deps: P1-12.

- **P1-14 Deleting an unreferenced asset removes both files.**
  Steps: seed unreferenced asset → teaser Delete → `confirmDialog`.
  Assert: `assets/{id}.json` and `lfs/{id}.{ext}` both gone; teaser removed; list decremented; delete commit.
  Helpers: `seedProject`, `stubFileDialog`, `confirmDialog`, `dataDir`.
  Deps: P1-12.

- **P1-15 Replacing an asset binary re-derives metadata and removes the old binary on extension change.**
  Steps: seed asset(png) → teaser Update → `stubFileDialog({ open → jpg temp })` → Save.
  Assert: size/mime/extension re-derived; `lfs/{id}.jpg` present, `lfs/{id}.png` gone; `updated` non-null; commit.
  Helpers: `stubFileDialog`, `makeTempFile`, `dataDir`.
  Deps: P1-12.

- **P1-16 Save-as exports the asset bytes to disk.**
  Steps: seed asset → teaser Save as → `stubFileDialog({ save → target under testInfo output })`.
  Assert: the target file exists with bytes equal to the source.
  Helpers: `stubFileDialog`, `dataDir`.
  Deps: P1-12.

- **P1-17 Projects list empty vs populated. — DONE (passing, `tests/specs/projects.spec.ts`).**
  Steps: fresh app on `#/projects` → assert the `No Projects yet` empty state → `setUserViaIpc` + `createProjectViaIpc` (defaults) → `reloadWindow`.
  Assert (desktop-only): the empty state shows while the list is empty; after seeding and a reload one card renders both the name ("Test Project") and description ("A Project created by the E2E tests") and the empty state is gone. The list renders skeletons while loading, then resolves to the card.
  Helpers: `createProjectViaIpc`, `reloadWindow`, `verifyCurrentRouteHash`.
  Deps: P0-01.

- **P1-18 Entry table lists entries with the expected chrome. — DONE (passing, `tests/specs/entries.spec.ts`).**
  Steps: `setUserViaIpc` + `createProjectViaIpc` + `createCollectionViaIpc` + two `createEntryViaIpc` with distinct titles ('First', 'Second') → `navigateToCollection`.
  Assert (desktop-only): both titles render as table cells and `No results.` is absent; the "Visible Values" column-visibility dropdown trigger is visible; the "Create Article" action (labelled with the collection singular) is visible. Asserting the two known values are present beats a brittle `getByRole('row')` count, which would include the header row.
  Helpers: `createCollectionViaIpc`, `createEntryViaIpc`, `stringValue`, `navigateToCollection`.
  Deps: P0-04.

- **P1-19 Reload lists multiple projects without duplication or loss.** _(moved down from P0-09 — list-render/count integrity, no data-loss risk)_
  Steps: seed 3 projects → `reloadWindow`.
  Assert: exactly 3 cards and `projects:count === 3`.
  Helpers: `seedProject`, `reloadWindow`, `ipc`.
  Deps: P0-01.

- **P1-20 Synchronize round-trip drives the ahead count to zero. — DONE (passing, `tests/specs/sync.spec.ts`).**
  Steps: `setUserViaIpc` + `createProjectViaIpc` → `setupRemote({ mirror: <project path> })` (a bare clone of the Project's current `work`, so it starts level, ahead 0) → `setRemoteOriginUrlViaIpc` → `createCollectionViaIpc` (one real local write, so `work` is now ahead by one) → `navigateToProjectDashboard` → sidebar Synchronize.
  Assert (desktop-only, per the doctrine): the Synchronize button is ENABLED while ahead by one, and after clicking it returns to DISABLED (ahead/behind driven to zero) while the app stays on the dashboard, so the sync resolved without hitting the root error boundary (the button lives in the sidebar, so its still being there proves the view was not replaced; the fixture's console check backs that up). The round-trip is corroborated on the runner (allowed as it observes only the remote ref, not file contents): `remoteWorkSha(remote.path)` reaches `localWorkSha(<project path>)`, proving the push landed. Core's file/commit correctness is Core's test.
  **Phase 0 probe (removed).** A temporary IPC probe confirmed `synchronize` resolves over a plain bare remote for a no-asset Project (the LFS-push step has nothing to transfer, so it does not reject with `PreconditionFailed`), which unblocked this happy path. See the LFS caveat below and in section 5.
  **LFS caveat:** the non-LFS metadata/commit round-trip is the reliable assertion (asserted here). Verifying that an LFS **binary** round-trips over a plain bare/`file://` remote is _not_ reliable without an LFS endpoint or a configured standalone transfer agent — a vanilla bare repo carries the pointer but not the object. LFS-object round-trip stays out of scope here (see section 5).
  Helpers: `setUserViaIpc`, `createProjectViaIpc`, `setupRemote`, `setRemoteOriginUrlViaIpc`, `createCollectionViaIpc`, `navigateToProjectDashboard`, `remoteWorkSha`, `localWorkSha`.
  Deps: P0-01, `setupRemote`.

- **P1-21 Synchronize integrity gate: a rebase that orphans a reference target stops the sync and does NOT push. — DONE (passing, `tests/specs/sync.spec.ts`).** _(the highest-ranked sync risk)_
  Steps: `setUserViaIpc` + `createProjectViaIpc` → `createCollectionViaIpc` with `[textFieldDefinition()` (required title)`, referenceFieldDefinition()` (optional single entry reference)`]` → E1 `createEntryViaIpc` (title + empty `referenceValue()`) → E2 `createEntryViaIpc` (title + `referenceValue(E1.id, collection.id)`, so E2 → E1) → `setupRemote({ mirror: <project path> })` (bare has E1 and E2) → `setRemoteOriginUrlViaIpc` → `deleteEntryOnRemote(collections/${collection.id}/${E1.id}.json)` (deletes E1 on the remote out of band, so E2 → E1 is now dangling ON the remote, bypassing Core's delete gate) → E3 `createEntryViaIpc` (a local commit, so local is ahead by E3 and behind by the remote's delete) → `navigateToProjectDashboard` → sidebar Synchronize.
  Assert (desktop-only, per the doctrine): the pull rebases E3 onto the remote (E1 deleted) and the pre-push scan finds E2 → E1 dangling and rejects with `Conflict`; the desktop app surfaces that failure **in place** through the sync-conflict modal ("Could not synchronize this Project"), not the root error boundary (the fixture's console check confirms no error escaped). Nothing was pushed: `remoteWorkSha(remote.path)` equals the SHA captured before the sync (E3 never reached the remote). Dismissing the modal leaves the app usable (the dashboard and its sidebar still render), so it is not left crashed or mid-rebase. Core's guard logic is Core's own test; the counts and the `Conflict` cause were confirmed with a scratch probe and are not asserted here.
  **Note (Core requires the optional value wrapper):** an optional reference field still needs its value present at create time (`content.<lang>` an array, empty for no target), so E1 and E3 carry `referenceValue()` (empty) rather than omitting the key. This differs from the original sketch, which assumed the key could be dropped.
  Helpers: `setUserViaIpc`, `createProjectViaIpc`, `createCollectionViaIpc`, `textFieldDefinition`, `referenceFieldDefinition`, `createEntryViaIpc`, `stringValue`, `referenceValue`, `setupRemote`, `setRemoteOriginUrlViaIpc`, `deleteEntryOnRemote`, `navigateToProjectDashboard`, `remoteWorkSha`, `dismissDialog`.
  Deps: P1-20, `setupRemote`, the sync-conflict modal (section 5). A regression here would ship a corrupt tree to the shared remote for every collaborator — highest sync value.

### P2 — settings, user identity, uniqueness, history, navigation, local API, i18n

- **P2-01 First-run user onboarding sets and persists identity.**
  Steps: fresh app → `/user/profile` → assert Welcome title (user null) → assert "Save local User" disabled until dirty (the gate enables once the required name/email are filled) → fill language/name/email/port, toggle local API → Save.
  Assert: navigate `/projects`; `user.json` written matching input; `user:get` returns it; UserDropdown renders; live commit preview updates as name/email change.
  Helpers: `ipc`, `dataDir`.
  Deps: none.

- **P2-02 Edit an existing user and confirm identity propagates to the git author.** _(added — P2-01 covers only first-run)_
  Steps: `setUser` → `/user/profile` (asserts the form resets from the existing user, not the Welcome state) → assert "Save local User" disabled until dirty (enables on the first edit) → change name/email/language → Save → make a commit (e.g. `seedProject` via UI).
  Assert: `user.json` updated; the next commit's author is the new name/email.
  Helpers: `setUser`, `getHistory`, `ipc`, `dataDir`.
  Deps: P2-01.

- **P2-03 Unauthorized gate: writes without a user throw 401 (IPC).**
  Steps: fresh app (no `setUser`) → `ipc('core.projects.create', …)`.
  Assert: rejects `Unauthorized(401)`; no project written on disk.
  Helpers: `ipc`, `dataDir`.
  Deps: none.

- **P2-04 Project language management: default cannot be removed; supported set persists.**
  Steps: seed project(supported en,de; default en) → settings/general → try removing `en`.
  Assert: removing `en` opens the blocking `default cannot be deleted` dialog and does not remove it → remove `de`, change default, Save → new supported set persists (guards the default-Select force-remount regression).
  Helpers: `seedProject`, `confirmDialog`/`dismissDialog`, `dataDir`.
  Deps: P0-01.

- **P2-05 Set/clear the remote origin URL.**
  Steps: seed project → settings/version-control → assert Save disabled until dirty → enter url → Save.
  Assert: `project.remoteOriginUrl` persisted; `getChanges` no longer throws `PreconditionFailed` for a missing origin → clearing to empty string removes the remote.
  Helpers: `seedProject`, `ipc`, `dataDir`.
  Deps: P0-01.

- **P2-06 History sidebar lists commits and the diff view renders per type.**
  Steps: seed user+project+collection+entry (several commits) → `/history`.
  Assert: sidebar lists commits newest-first → selecting a collection commit renders `CollectionDiff`; an entry commit `EntryDiff`; project-create `ProjectDiff`; title derives from method+objectType.
  Helpers: `seedCollection`, `seedEntry`, `getHistory`.
  Deps: P0-04.

- **P2-07 Dashboard shows latest changes and links to full history.**
  Steps: seed project + a few commits → dashboard.
  Assert: `Latest changes` shows up to 5 commits; `Full History` navigates `/history`; `Current Project` JSON panel present.
  Helpers: `seedProject`, `seedCollection`, `seedEntry`.
  Deps: P0-04.

- **P2-08 Redirect chains land on the right routes.**
  Assert: `/`→`/projects`, `/projects/$id`→dashboard, `/settings`→settings/general, `/user`→user/profile, `/$entryId`→`$entryId/update` (all via `verifyCurrentRouteHash`).
  Helpers: `seedProject`, `seedCollection`, `seedEntry`, `verifyCurrentRouteHash`.
  Deps: P0-04.

- **P2-09 Not-found and root error boundary render and recover.** _(needs console escape hatch)_
  Steps: navigate to an unknown hash → assert `Not Found` with the attempted href and Back-to-Projects/Reload → force a route error (a project route with a bad id, hitting the `throwOnError` read path) → assert `ErrorComponent` with the message and that Back-to-Projects returns to `/projects`.
  Helpers: console escape hatch, `verifyCurrentRouteHash`.
  Deps: console escape hatch.

- **P2-10 Uniqueness collision on a unique field (IPC).** _(moved up from P3-07 — Core integrity guarantee, on par with reference integrity)_
  Steps: collection with an `isUnique` text field → create entry value `x` → create a second with `x`.
  Assert: `Conflict(409)` `unique_collision`; the first entry intact.
  Helpers: `seedCollection`, `seedEntry`, `ipc`, `dataDir`.
  Deps: P0-04.

- **P2-11 Local API lifecycle from the profile toggle.**
  Steps: set user with local API enabled → assert `api:isRunning` true → probe `GET http://localhost:{port}/openapi.json` → change user to disabled → assert `api:isRunning` false and the port refuses connections.
  **Constraint:** the API runs in the main process and its CORS is localhost-only; the renderer's origin is the app's custom protocol, so `fetch` from `page.evaluate` cannot reach it. Probe from the **Node/runner side** with a Playwright `APIRequestContext` (`request.newContext().get(...)`), not renderer fetch.
  Helpers: `setUser`, `ipc`, `apiRequest` (runner-side `APIRequestContext`).
  Deps: P2-01.

- **P2-12 Clone a project from a local bare remote.**
  Steps: `setupRemote` seeded with a project → `/projects` Clone dialog → submit the bare-repo path.
  Assert: dialog closes; a new `projects/{id}` folder appears; `projects:count` increments; `Conflict(409)` when cloning the same id twice.
  **LFS caveat:** same as P1-20 — asserting that LFS binaries are _materialized_ after clone requires a working LFS transfer for the remote; over a vanilla bare/`file://` remote only pointers arrive. Assert the non-LFS folder/count/commit result; gate the "binaries materialized" assertion on confirmed LFS transfer config.
  Helpers: `setupRemote`, `confirmDialog`, `ipc`, `dataDir`.
  Deps: `setupRemote`.

- **P2-13 `getChanges` behind-path and sidebar counts when the remote is ahead (needs bare remote).** _(added — P1-20 drives only "ahead")_
  Steps: `setupRemote` → seed project + set origin → push a commit to the remote out-of-band so the local is behind.
  Assert: `getChanges` reports behind > 0, ahead 0; the sidebar renders the behind count and gates/enables Synchronize accordingly; a Synchronize pulls it to behind 0.
  Helpers: `setupRemote`, `ipc`.
  Deps: P1-20.

- **P2-14 i18n: date/datetime/time entry fields and EntryTable temporal columns render per the user's language, with date-fns locales loaded on demand.** _(added — subject of the most recent commit)_
  Steps: `setUser({ language: 'de' })` → seed collection with date/datetime/time fields + entry → open `entry/update` and the collection table.
  Assert: the field inputs and the EntryTable temporal columns are formatted for `de`; switching the user language re-formats; the on-demand date-fns locale import succeeds with **no console error** (a broken dynamic import would both mis-render and trip the fixture's console assertion).
  Helpers: `setUser`, `seedCollection`, `seedEntry`, `fillEntryForm`.
  Deps: P0-04.

- **P2-15 Multi-language translatable content across more than one supported language.** _(added — the core promise of a translatable CMS, absent from every other content spec)_
  Steps: seed project(supported en,de) + collection with a translatable text field → create an entry, filling both languages via the per-language translatable dialog.
  Assert: `values.<slug>.content` has both `en` and `de`; the translatable dialog is a distinct widget and both entries persist; required-field validation applies per language.
  Helpers: `seedProject`, `seedCollection`, `fillEntryForm` (per-language path), `dataDir`.
  Deps: P0-04, P2-04.

### P3 — validation edges, empty/error states, view, pagination, accessibility

- **P3-01 Project create form surfaces validation on submit, not by disabling. — DONE (passing, `tests/specs/projects.spec.ts`).**
  Steps: `setUserViaIpc` → `navigate` to `#/projects/create` → Create with empty name + description.
  Assert (desktop-only, per the doctrine): on open the "Create Project" button is enabled (no submit-disable) and neither the name nor description field is flagged (`aria-invalid` "false", so no errors on open); clicking Create with both empty flips both fields to `aria-invalid` "true" (validation surfaced on click) and the URL stays on `#/projects/create`, so the submit did not go through and nothing was created. "No submit" is proven by no-navigation, not by reading disk. Core's zod message text is Core's test, not asserted here.
  Helpers: `setUserViaIpc`, `navigate`.
  Deps: none.

- **P3-02 Collection slug validation (regex + reserved blocklist).**
  Steps: collection create → enter `index` (reserved), an uppercase slug, and a `double--hyphen` slug.
  Assert: each rejected with a message → a valid `blog-posts` slug is accepted.
  Helpers: `addFieldDefinition` (form driving).
  Deps: P0-03.

- **P3-03 Duplicate field-definition slug rejected before append.**
  Steps: collection create → add two field definitions with the same slug.
  Assert: `A Field with the slug "x" already exists`; only one appended.
  Helpers: `addFieldDefinition`.
  Deps: P0-03.

- **P3-04 Field-definition bounds refinements.**
  Steps: add a text field with min>max; a range with default outside min/max; a field marked unique with a default.
  Assert: refine error for min>max; error for out-of-range default; `A unique field cannot have a default value`.
  Helpers: `addFieldDefinition`.
  Deps: P0-03.

- **P3-05 Entry required + format validation, respecting the dirty gate. — DONE (passing, `tests/specs/entries.spec.ts`).**
  Steps: `setUserViaIpc` + `createProjectViaIpc` + `createCollectionViaIpc` with `fieldDefinitions: [emailFieldDefinition() (required), textFieldDefinition({ slug: 'note', label: { en: 'Note' }, isRequired: false })]` → `navigateToEntryCreate`.
  Assert (desktop-only, per the doctrine): on open "Create Article" is disabled (the dirty gate) and Email is not flagged (`aria-invalid` "false"); filling the optional Note dirties the form with Email still empty, so the button enables, and submitting flags Email `aria-invalid` "true" while the URL stays on the create route (required path); filling Email with `notanemail` and submitting keeps it flagged and on the create route (format path); filling Email with `valid@example.com` and submitting navigates to the Collection detail (valid path, the create went through). Single-language (en) collection, since per-language validation across multiple languages is P2-15's scope. Because the create is dirty-gated, a pristine empty form cannot be submitted by design, so a "required" error is only reachable after dirtying the form via another field. Core's zod message text is Core's test, not asserted here.
  Helpers: `setUserViaIpc`, `createProjectViaIpc`, `createCollectionViaIpc`, `emailFieldDefinition`, `textFieldDefinition`, `navigateToEntryCreate`, `fillEntryForm`.
  Deps: P0-04.

- **P3-06 Asset form validation and update dirty-gate.** _(added)_
  Steps: assets route → `stubFileDialog({ open → temp })` → Add Asset with empty description (description is `min(1)`) → submit → assert blocked with a message; fill it → succeeds. Then on an existing asset's Update form, assert the Update button is isDirty-gated.
  Helpers: `stubFileDialog`, `makeTempFile`, `seedProject`.
  Deps: P1-12.

- **P3-07 Empty states across the app. — DONE (passing, `tests/specs/empty-states.spec.ts`).**
  Steps: walk all four in one spec in an order that keeps each precondition true: fresh app on `#/projects` → `setUserViaIpc` + `createProjectViaIpc` + `navigateToAssets` → `navigate` to the project's `collections` → `createCollectionViaIpc` + `navigateToCollection`.
  Assert (desktop-only): `No Projects yet`, `No Assets yet`, `No Collections found` (the collections sidebar), and `No results.` (the entry table) each render when their total is 0. This is the single place all four empty strings are pinned, so a renamed empty state is caught (the overlap with P1-17/P1-18 is intentional for that reason).
  Helpers: `createProjectViaIpc`, `navigateToAssets`, `createCollectionViaIpc`, `navigateToCollection`, `navigate`, `verifyCurrentRouteHash`.
  Deps: P0-01.

- **P3-08 Asset teaser View/preview dialog.** _(added)_
  Steps: seed asset → teaser View → assert the preview dialog opens and the binary loads via the custom `elek-io-local-file:` protocol with **no CSP/console error** (a likely failure point given the strict CSP on the packaged build).
  Helpers: `seedProject`, `stubFileDialog` (for seed), `dismissDialog`.
  Deps: P1-12.

- **P3-09 Entry table pagination and inert filter.** _(added)_
  Steps: seed collection + >10 entries → collection detail.
  Assert: pagination renders with page size 10 and pages through the rows; typing in the filter input does **not** change the row set (filtering is not wired) — pins the inert filter so a future half-wired change is caught.
  Helpers: `seedCollection`, `seedEntry`.
  Deps: P1-18.

- **P3-10 Global chrome: version info and history navigation.**
  Steps: open the `elek.io Desktop` dropdown.
  Assert: Desktop/Core/Electron/Chromium/Node versions render from `process.versions`; `Report an issue` present; Back/Forward navigate router history; breadcrumb crumbs are links.
  Helpers: `seedProject` (for a non-trivial breadcrumb trail).
  Deps: P0-01.

- **P3-11 Per-route accessibility assertions (opt-in).**
  Steps: on already-clean routes (projects list, create, dashboard) run `expectNoAxeViolations`, ahead of the fixture-wide assertion the `@todo` defers.
  Helpers: `expectNoAxeViolations`.
  Deps: P0-01.

## 4. Helpers / fixtures to build first

Build these before their first consumer; ordered by dependency (each later helper tends to use the earlier ones).

**Status (implemented so far):** `tests/helpers/user.ts` (`setUserViaIpc`), `tests/helpers/project.ts` (`createProjectViaIpc`, `setRemoteOriginUrlViaIpc`, `fillProjectForm`, `createProject`, `navigateToProjectSettings`, `navigateToProjectDashboard`, `navigateToAssets`), `tests/helpers/collection.ts` (`createCollectionViaIpc`, `textFieldDefinition`, `emailFieldDefinition`, `referenceFieldDefinition`, `fillCollectionForm`, `addFieldDefinition`, `createCollection`, `navigateToCollection`/`navigateToCollectionCreate`/`navigateToCollectionSettings`), `tests/helpers/entry.ts` (`createEntryViaIpc`, `stringValue`, `referenceValue`, `fillEntryForm`, `navigateToEntryCreate`, `navigateToEntryUpdate`), `tests/helpers/dialog.ts` (`confirmDialog`, `dismissDialog`), `tests/helpers/navigation.ts` (`verifyCurrentRouteHash`, `reloadWindow`, `navigate`), `tests/helpers/remote.ts` (`setupRemote`, `remoteWorkSha`, `localWorkSha`, `deleteEntryOnRemote`), `tests/helpers/app.ts` (`relaunchApp`), the `launchApp` export in `tests/fixtures/electronApp.ts`, and `tests/global.d.ts`. Specs **P0-01 through P0-06, P0-08, P0-10, P0-11, P1-01, P1-07, P1-11, P1-17, P1-18, P1-20, P1-21, P3-01, P3-05 and P3-07** are written, migrated to the doctrine, and passing (P0-07's IPC-level guard test was dropped as a Core duplicate). The helpers below without a "(built)" tag are still to add.

**Naming:** the suite drives the UI by default, so UI helpers are unmarked and IPC helpers are suffixed `ViaIpc` (see [`testing.md`](./testing.md#writing-tests)). Pending entries below still use pre-convention names like `seedProject`; those become `createProjectViaIpc` and similar as each is migrated.

- **Typed IPC wrappers (built)** — thin helpers over the globally-typed `window.ipc`, each a small `page.evaluate` call, used to **arrange** state (`createProjectViaIpc`, `setUserViaIpc`). A single generic `ipc(page, path, ...args)` was intentionally **not** built: a stringly-typed dotted path cannot be typed without an `as any` cast, which the repo forbids. Per-operation wrappers stay fully type-safe and cast-free, mirroring the app's own `queries/options`. Because specs type-check under the Node tsconfig (no DOM lib), `window` is declared once in `tests/global.d.ts`; its `ipc` shape comes from the global augmentation in `src/index.d.ts`.
- **Read-back / disk helpers — dropped (not built).** An earlier plan had `dataDir` / `readDataFile` / `listProjects` / `projectHistory` and similar to assert Core's on-disk files and commits. The verification doctrine (section 1) removes those assertions from the desktop suite, so these helpers are not needed. Observe results through the UI (or a throw / no-throw on a seed/guard call) instead.
- **Console escape hatch (infra)** — extend the `mainWindow` fixture with an opt-in expected-console allow-list (or a per-spec teardown-skip). A prerequisite for UI-driven negative-path specs that reach the root error boundary (which logs via `console.error` + `core:logger:error`): P1-13, P2-09, and any UI-driven failing create/update/delete. Flows that handle the error in place (P0-11) never reach the boundary and need no hatch. IPC-level negatives that await the rejected promise in `page.evaluate` are unaffected.
- **`setUserViaIpc(page, overrides?)` (built)** — `core:user:set` precondition (git author identity); returns the User. Narrowed to the local-User branch of the `SetUserProps` union. Required before any write.
- **`createProjectViaIpc(page, overrides?)` (built)** — `core:projects:create` with sensible defaults, returns the Project. The IPC-seed counterpart of `createProject`.
- **`createProject(page, props)` + `fillProjectForm` (built)** — click through from the Projects list, fill name + description, submit, and return the new projectId from the redirect URL. A `selectProjectLanguage` helper for the custom language Popover/Command widget is still to add (the default en/en is used until then).
- **`createCollectionViaIpc(page, overrides)` (built)** — `core:collections:create` with sensible defaults (a valid single-language Collection with one required text field); `projectId` is required, field-definition ids are generated in the helper (Core matches definitions by id). Returns the Collection. Ships with `textFieldDefinition(overrides)`, a builder for a required text FieldDefinition, and `emailFieldDefinition(overrides)` (built), the same for a required email FieldDefinition (no min/max), used to drive the required and format validation paths in P3-05.
- **`addFieldDefinition(page, { label, description })` (built, text only)** — drive the "Add Field" sheet in `CollectionForm` to append one text field definition (fill the translatable label + description, the slug auto-derives, confirm with "Add definition"). Extend to the other value-definition sub-forms (number/select/reference/markdown/date/etc.) for later collection and validation tests.
- **`createEntryViaIpc(page, { projectId, collectionId, values })` (built)** — `core:entries:create` with `values` keyed by field slug; ships with `stringValue(content)`, a builder for a translatable string Value. **`fillEntryForm(page, fields)` (built, text only)** — fill the dynamically generated entry form keyed by field label. Extend it to handle the per-language translatable dialog (P2-15) and temporal fields (P2-14).
- **`navigate(page, hash)` (built)** — point the URL at a route hash and reload so the app boots fresh there (a fresh boot refetches from Core, which arranged IPC state needs since it does not touch the renderer cache). **`navigateToCollection`/`navigateToCollectionCreate`/`navigateToCollectionSettings`/`navigateToEntryCreate`/`navigateToEntryUpdate` (built)** wrap it for the collection and entry routes, and **`navigateToProjectSettings` (built)** for a Project's general settings, **`navigateToProjectDashboard` (built)** for a Project's dashboard (where the sidebar with the Synchronize control renders), and **`navigateToAssets` (built)** for a Project's Assets list, each confirming the hash via `verifyCurrentRouteHash`.
- **`reloadWindow(page)`** — `page.reload()` then wait for `#app` and the expected hash. Basis of the renderer-refetch persistence cases (P0-02, P0-05, P1-17, P1-19). **Note its scope:** it reloads only the renderer; main + Core stay alive, so it proves renderer re-fetch over IPC, not process-restart survival.
- **`launchApp(testInfo, overrides?)` (built)** — the launch body extracted from the `electronApp` fixture (`tests/fixtures/electronApp.ts`): find the unpacked build, build the env (skip undefined, set `NODE_ENV=test` + `ELEK_IO_DATA_DIR`, delete `ELECTRON_RUN_AS_NODE`), launch with `--user-data-dir`, and mirror stdout/stderr. `dataDir` and `userDataDir` default to the per-test output paths, overridable so a relaunch can reuse them. The fixture calls it with the defaults, so the existing specs are unchanged.
- **`relaunchApp(testInfo, app)` (built)** — `tests/helpers/app.ts`: `app.close()` then `launchApp` against the **same** `ELEK_IO_DATA_DIR` and userData dir, returning the new app and its first window. The only way to test true survival across a main-process restart (P0-10). The fixture's `electronApp` teardown tolerates the already-closed app (a double close cannot fail teardown), and its `mainWindow` teardown skips the console/axe checks when the first window is already closed (the relaunched window is out of scope for those checks).
- **`getHistory(page, projectId)`** — read `core:projects:history` to assert commit subjects, trailers, order, and author.
- **`confirmDialog(page, confirmName)` / `dismissDialog(page)` (built)** — the shared shadcn Dialog/AlertDialog flows (project/collection/asset deletes, clone dialog, default-language guard, asset view). `confirmDialog` scopes to the open dialog so the confirm button is not confused with the trigger that opened it; `dismissDialog` closes with Escape.
- **`expectToast(page, text)`** — assert Sonner success/error toasts after mutations. Remember: on failure today the toast fires **and** the root `ErrorComponent` renders (the boundary half is changing for expected errors, see section 5).
- **`stubFileDialog(page/electronApp, { open?, save? })`** — **applied in the MAIN process** via `electronApp.evaluate(({ dialog }) => …)`, overriding `dialog.showOpenDialog` / `dialog.showSaveDialog` to return canned paths. It cannot be applied in the renderer: `contextBridge.exposeInMainWorld` freezes `window.ipc` and the calls forward to main. Needed for every asset flow (P1-12, P1-15, P1-16, P3-06, P3-08).
- **`makeTempFile(testInfo, name, bytes)`** — write a source file under the test output for asset create/replace/save.
- **`setupRemote(testInfo, options?)` (built)** — `tests/helpers/remote.ts`: create a local **bare** git repo to act as origin for synchronize/clone/getChanges and the two `project.delete` remote guards. Runs on the runner via the system `git` (`git init --bare`, or `git clone --bare <mirror>` to seed it level with an existing repo). Returns `{ path, url }` where `url` is the absolute bare path (dugite accepts it directly). Reliable for commit/ref round-trips; see the LFS caveat in section 5.
- **`remoteWorkSha(remotePath)` / `localWorkSha(dir)` (built)** — `tests/helpers/remote.ts`: read the `work` branch SHA of a bare remote (`git ls-remote`) or a local repo (`git rev-parse`). Comparing them corroborates a sync round-trip (P1-20) or that a rejected sync pushed nothing (P1-21). This observes only the ref, not file contents, so it stays within the desktop verification doctrine (the runner-side git check the doctrine allows).
- **`deleteEntryOnRemote(testInfo, remotePath, relPath)` (built)** — `tests/helpers/remote.ts`: clone the bare to a throwaway working tree, `git rm` the Entry file on `work`, commit (with an inline identity so the runner needs no global git config), and push `work` back to the bare. Arranges a remote whose `work` tree already holds a dangling reference, a state Core's own delete gate would never produce, so a following local `synchronize` hits the sync-time integrity gate (P1-21).
- **`referenceFieldDefinition(overrides?)` (built)** — `tests/helpers/collection.ts`: an optional single-entry reference `FieldDefinition` (`fieldType: 'entry'`, `ofCollections: []` = any, `max: 1`), the counterpart of `textFieldDefinition`/`emailFieldDefinition` for arranging Collections whose Entries point at one another. **`referenceValue(entryId?, collectionId?)` (built)** — `tests/helpers/entry.ts`: the matching Entry Value builder; with both ids it points at one target Entry (carrying `collectionId`, which Core's storage needs), with no args it builds an empty reference (Core still requires the value wrapper for an optional reference field).
- **`apiRequest(playwright)` (runner-side)** — a Playwright `APIRequestContext` (`request.newContext()`) to probe the local API from Node (P2-11), since the renderer's custom-protocol origin cannot reach `http://localhost`.
- **`expectNoAxeViolations(page)`** — opt-in per-route accessibility assertion ahead of the fixture-wide enforcement the `@todo` defers.

## 5. Known constraints and things deliberately out of scope

- **Error contract and test-sequencing decision.** Every mutation built through `customMutationOptions` gets `throwOnError: true` (`util.ts:72`). On failure `onError` shows a `toast.error` and logs via `core:logger:error` (`util.ts:122`), and independently `throwOnError` re-throws in the render phase. Because only `__root.tsx` defines an `errorComponent`, that re-throw replaces the whole view with the root error screen (whose only exits are Back-to-Projects and Reload). So there is no "toast shows and the source route stays" state today. **Product decision:** this full-view takeover is a reasonable v1 catch-all but the wrong response to expected, recoverable Core errors (the 400/409/412 guards raised by normal user actions). Handling those in place (stay on the page plus toast, inline errors, or a follow-up modal) is a separate track, and the force-delete modal (P0-11, now landed) is its first instance. **Sequencing (decided): decouple.** Do not pin the boundary takeover for expected mutation errors. Happy-path specs and IPC-level negatives proceed now. UI-driven mutation-negative specs that would assert the root error screen wait until the error-UX track handles their case: currently the **UI half of P1-13** (P0-11 has landed, using a per-call `throwOnError: false` override to catch the rejection and show a dialog instead of the boundary). Route-load and not-found boundary behavior (**P2-09**) is not part of this change and stays as-is.
- **Strict console assertion.** The `mainWindow` fixture fails on any console error/warning on a passing test. UI-driven negative-path specs must use the console escape hatch, or they are unwritable. This is scoped in section 4 as a build-first prerequisite.
- **Native file-picker dialogs.** `electron:dialog:*` cannot be driven by Playwright and cannot be stubbed from the renderer (frozen contextBridge, handled in main). All asset flows depend on the main-process `stubFileDialog`.
- **git-lfs binary transfer over a plain remote.** A vanilla bare/`file://` remote carries LFS **pointers** but not LFS **objects** without an LFS endpoint or a configured standalone transfer agent. Assertions that an LFS binary round-trips (P1-20) or that binaries are materialized after clone (P2-12) are **out of scope** unless Core is confirmed to configure a `file://`/standalone LFS transfer. The non-LFS commit/metadata round-trip is fully in scope.
- **Local API reachability.** The local API runs in the main process with localhost-only CORS; probe it from the Node runner side via `APIRequestContext`, never from renderer `fetch`.
- **Renderer reload vs process restart.** `reloadWindow` (`page.reload()`) reloads only the renderer; use `relaunchApp` (close + relaunch against the same `ELEK_IO_DATA_DIR`) for true cross-restart persistence (P0-10).
- **Fixed — `general.tsx` UI delete now has a force fallback (P0-11).** The delete used to call `deleteProject({ id })` with **no `force`**; a local-only project always hit Core's guard (`412`/`409`) and, via the global `throwOnError: true`, detonated the root error boundary, so it could never be deleted through the UI. The delete mutation now overrides `throwOnError: false` at the call site and suppresses the wrapper's error toast, so the rejection is caught and opens a force-delete confirmation dialog that re-issues the delete with `{ force: true }`. This is the first landed instance of the in-place error-UX handling described above.
- **Fixed — `project-sidebar.tsx` Synchronize now surfaces a failed sync in place (P1-21).** The sidebar Synchronize used to `await synchronizeProject({ id })` with the global `throwOnError: true`, so any sync rejection (most importantly Core's sync-time integrity gate rejecting a rebase that would push a dangling reference) detonated the root error boundary. The synchronize mutation now overrides `throwOnError: false` at the call site and suppresses the wrapper's error toast, and the `onClick` catches the rejection and opens a controlled "Could not synchronize this Project" dialog explaining nothing was pushed. This is the second landed instance of the in-place error-UX handling, after the force-delete modal. The title is generic on purpose, so it covers a `Conflict` (dangling reference), an LFS-endpoint failure, or a network outage without discriminating error types. See the pattern in [`renderer/loading-and-updating-data.md`](./renderer/loading-and-updating-data.md#handling-expected-errors-in-place).
- **No unit runner.** There is no non-E2E path to exercise Core in isolation; all Core behavior is reached through the running packaged app via `window.ipc`.
