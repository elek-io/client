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
- **P1 — the rest of CRUD + content integrity + sync.** Update flows (the collection-update happy path is P1-11; its schema-cascade internals — rename/remove/narrow/non-deterministic + resolutions retry — are Core's own tests and were dropped, see P1-02..P1-06 in section 3), write-time reference integrity, assets (two-file model), synchronize round-trip **and its dangling-reference integrity gate**, list/read states.
- **P2 — settings, user identity, uniqueness, history, navigation guards, local API, i18n/locale, multi-language content.**
- **P3 — validation edges, empty/error states, asset view/validation, table pagination, accessibility.**

Within a tier, cases are ordered by how foundational the flow is: set a user before any write, create a project before anything inside it, a collection before entries, and so on. Each case names the helpers it needs; the reusable helpers live in section 4 and should be built before their first consumer.

**Infra prerequisites this backlog exposes (build these first — see section 4):**

- **Launch race, fixed in the app (not a test concern).** The main process used to register its `window.ipc` handlers only after loading the renderer (`onAppReady` in `src/main/index.ts`), so a freshly opened window could run a `ViaIpc` seed before the handlers existed and flake with "No handler registered". `onAppReady` now creates the window, registers the handlers, then loads the renderer, which closed the race for every seed-first spec (and for real launches). See the Application Lifecycle section in [`overview.md`](./overview.md). No test-side readiness wait is needed.
- The per-test data dir is computed inside the fixture and never exported. Surface it (`dataDir(testInfo)` / `readDataFile` / `listDataDir`) so specs can assert Core's storage layout.
- **Console escape hatch is a prerequisite for _every_ UI-driven negative-path spec, not just the error-boundary case.** The `mainWindow` fixture asserts zero console errors/warnings on pass (`electronApp.ts:150`). Because failed mutations hit the root error boundary, React logs the caught error to `console.error` and the app logs via `core:logger:error`. Add an opt-in expected-console allow-list before writing P1-13, P2-09, or any UI-driven failing create/update/delete that reaches the error boundary. A flow that handles the error in place instead (like P0-11's force-delete modal, which overrides `throwOnError: false` and suppresses the toast) never reaches the boundary and needs no hatch. IPC-level negatives that `await` a rejected promise inside `page.evaluate` (P0-08, P1-09, P1-10) do **not** trip this either. (P1-04..P1-06 were dropped as Core duplicates, and P2-03 and P2-10 were reclassified as deferred UI-negatives that would reach the boundary, so they left this IPC-only set — see section 3.)
- **Native `electron:dialog:*` modals must be stubbed in the MAIN process,** not the renderer. `contextBridge.exposeInMainWorld` freezes the exposed `window.ipc`, and the dialog calls forward to Electron's `dialog.showOpenDialog/showSaveDialog` in main. The handlers capture those methods by reference at registration (`main/index.ts`), so reassigning `dialog.showOpenDialog` at runtime does not intercept; the stub instead runs `electronApp.evaluate(({ ipcMain }) => …)` to `removeHandler` + re-`handle` each channel with a canned result (see `stubFileDialog` in section 4). This affects every asset flow (P1-12, P1-15, P1-16, P3-06, P3-08).
- **A controllable git origin (`setupRemote`)** — a local bare repo — is needed for synchronize/clone/getChanges and the two `project.delete` remote guards.

## 2. Coverage matrix / gap summary

Existing coverage (the one spec): app launch, `#app` visible, title, `/ → /projects` redirect, plus the implicit per-pass checks (zero console errors/warnings; axe scan runs but does not assert). Everything marked "gap" is uncovered.

| IPC channel                                                                  | Existing coverage       | Backlog IDs                                                     |
| ---------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------- |
| projects:create                                                              | gap                     | P0-01, P0-02, P2-03 (deferred), P3-01 (done)                    |
| projects:list / count                                                        | gap                     | P0-01, P1-17 (done), P1-19, P3-07 (done)                        |
| projects:read                                                                | gap                     | P0-02, P2-06                                                    |
| projects:history                                                             | gap                     | P2-06, P2-07                                                    |
| projects:update                                                              | partial                 | P1-01 (done), P2-04 (done)                                      |
| projects:delete                                                              | gap                     | P0-11 (done), P0-08 (done), P0-10(indirect)                     |
| projects:getChanges                                                          | partial (via sidebar)   | P1-20 (done), P2-05, P2-13                                      |
| projects:setRemoteOriginUrl                                                  | partial                 | P0-08 (done), P2-05 (done), P1-20 (done), P2-13                 |
| projects:synchronize                                                         | partial                 | P1-20 (done), P1-21 (done), P2-13                               |
| projects:clone                                                               | gap                     | P2-12                                                           |
| collections:list                                                             | gap                     | P0-03, P1-18 (done), P3-07 (done)                               |
| collections:create                                                           | gap                     | P0-03                                                           |
| collections:read                                                             | gap                     | P0-03, P0-06                                                    |
| collections:update                                                           | gap                     | P1-11 (done) (P1-02..P1-06 dropped, see section 3)              |
| collections:delete                                                           | gap                     | P0-06                                                           |
| entries:list                                                                 | gap                     | P0-04, P1-18 (done), P3-07 (done)                               |
| entries:create                                                               | gap                     | P0-04, P1-10, P2-15, P3-05 (done), P3-06(ref), P2-10 (deferred) |
| entries:read                                                                 | gap                     | P0-05, P1-08                                                    |
| entries:update                                                               | gap                     | P1-07 (done), P1-08                                             |
| entries:delete                                                               | gap (no UI; IPC-only)   | P1-09                                                           |
| assets:list                                                                  | gap                     | P1-12 (done), P3-07 (done)                                      |
| assets:create                                                                | gap                     | P1-12 (done)                                                    |
| assets:read                                                                  | gap                     | P1-12 (done), P1-16 (done), P3-08 (done)                        |
| assets:update                                                                | gap                     | P1-15 (done), P3-06 (done)                                      |
| assets:delete                                                                | gap                     | P1-13 (done), P1-14 (done)                                      |
| assets:save                                                                  | gap                     | P1-16 (done)                                                    |
| user:get / set                                                               | partial                 | P2-01 (done), P2-02 (done), P2-03 (deferred)                    |
| api:start / stop / isRunning                                                 | gap                     | P2-11                                                           |
| logger:*                                                                     | indirect only           | (exercised via P2-09; no dedicated case)                        |
| electron:dialog:showOpen/showSave                                            | native, stubbed in main | P1-12 (done), P1-15 (done), P1-16 (done), P3-06 (done)          |
| i18n / date-fns locale rendering                                             | gap                     | P2-14                                                           |
| App launch / title / `/`→`/projects`                                         | **covered**             | —                                                               |
| Redirect chains ($projectId→dashboard, $entryId→update, settings/user index) | gap                     | P2-08                                                           |
| Root not-found + error boundary                                              | gap                     | P2-09                                                           |
| Global chrome (versions, back/forward, breadcrumbs)                          | gap                     | P3-10                                                           |

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

- **P0-09 — DROPPED. Asserting commit trailers, message format and author duplicates Core.**
  A first version asserted each commit's `Method`/`Object-Type`/`Object-Id`/`Collection-Id` trailers, newest-first ordering and the git author across object types. Under the verification doctrine those are Core's own tests (Core stamps the commit and separately tests its content and format), so they do not belong in the desktop suite. The desktop-relevant behavior, that the configured User identity reaches the git author, is covered by **P2-02** (edit the user, then observe the next commit's author).

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

- **P1-02 — DROPPED. Asserting rename-by-id preserves entry data duplicates Core.**
  A first version asserted that a `collection.update` renaming a field by id carries the entry's value to the new slug with content preserved. That is Core's own data-migration result, which Core tests itself, so under the verification doctrine (rule 2, asserting Core's internal correctness) it does not belong in the desktop suite. The collection-update UI happy path is already covered by **P1-11**, and its failure surface is deferred to the error-UX track (section 5), so this IPC assertion only duplicates Core.

- **P1-03 — DROPPED. Asserting remove-field drops exactly that value duplicates Core.**
  A first version asserted that removing a field by id drops that one value and leaves the others intact. That is Core's own data-migration result (rule 2), covered by Core's tests. The desktop happy path is **P1-11**; its failure surface is deferred (section 5), so this IPC assertion only duplicates Core.

- **P1-04 — DROPPED. Asserting Core's non-deterministic-change guard and rollback duplicates Core.**
  A first version asserted a `Conflict(409)` with a `missing_required` cause and an atomic on-disk rollback when a required field is added with no default. The collection update has a UI path (the collection settings form, **P1-11**), so under the doctrine its failure is observed through the UI, not by a bare IPC assertion (rule 1), and the guard plus rollback internals are Core's own tests (rule 2). That UI failure surface is deferred to the error-UX track (section 5).
  **Possible future desktop enhancement (out of current scope):** surfacing a collection-update schema conflict IN PLACE, a fourth in-place-modal consumer alongside force-delete, sync and asset-in-use (see [`error-handling.md`](./error-handling.md#handling-expected-errors-in-place)), would be follow-up product work plus a UI-driven spec.

- **P1-05 — DROPPED. Asserting the other non-deterministic issue types and the resolutions-map retry duplicates Core.**
  A first version drove each of `type_mismatch`, `constraint_violation` and `unique_collision` as `Conflict(409)` causes, then retried the update with a `resolutions` map. Those causes and the documented resolutions recovery are Core's own guard internals (rule 2) for a flow that has a UI path (rule 1), whose failure handling is deferred to the error-UX track (section 5). Same possible future in-place enhancement as noted on **P1-04**.

- **P1-06 — DROPPED. Asserting a narrowed reference field strips now-disallowed refs duplicates Core.**
  A first version asserted that narrowing a reference field's `ofCollections` silently removes the now-disallowed refs from an entry while preserving the still-allowed ones. That silent-strip is Core's own data-migration result (rule 2), covered by Core's tests. The desktop happy path is **P1-11**; its failure surface is deferred (section 5), so this IPC assertion only duplicates Core.

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

- **P1-09 `entry.delete` reference guard and success (sanctioned no-UI-path IPC guard).**
  **No-UI-path premise verified:** there is no UI control to delete an Entry. The `EntryTable` actions column is commented out (`entry-table.tsx`), the entry update route (`$entryId/update.tsx`) exposes only an "Update" action, and the entry layout is a bare `Outlet`. So this guard has genuinely no UI path and is observed as a bare IPC throw / no-throw, the one IPC-only case the doctrine sanctions.
  Steps: seed a collection with an entry-reference field and entries E1, E2 where E2 references E1 → delete E1 over IPC and observe it **rejects** (still referenced) → delete E2, then delete E1 and observe both **resolve**.
  Assert: the referenced delete rejects, and once the referrer is gone the delete succeeds (throw / no-throw only). Core's error type, its cause payload (the referencing entries) and the on-disk file removal are Core's own tests, not asserted here.
  Helpers: `createCollectionViaIpc`, `referenceFieldDefinition`, `createEntryViaIpc`, `referenceValue`.
  Deps: P0-04.

- **P1-10 Entry write-time reference integrity: broken reference rejected (sanctioned no-UI-path IPC guard).** _(moved up from P3-06 — content-integrity gate)_
  **No-UI-path premise verified:** the entry form's reference field is a picker that only offers existing targets. `FormEntryField` (`form.tsx`) lists entries fetched from the allowed collections and toggles their ids, with no free-text id input, so a non-existent reference id cannot be submitted through the UI. The guard therefore has no UI path and is observed as a bare IPC throw.
  Steps: create an Entry over IPC with a reference to a non-existent id and observe it **rejects**.
  Assert: the create rejects (throw only). Core's error type, message and cause (`reference_not_found`) and the no-file-written result are Core's own tests, not asserted here.
  Helpers: `createCollectionViaIpc`, `referenceFieldDefinition`, `createEntryViaIpc`, `referenceValue`.
  Deps: P0-03.

- **P1-11 Update a collection is dirty-gated and persists. — DONE (passing, `tests/specs/collections.spec.ts`).**
  Steps: `setUserViaIpc` + `createProjectViaIpc` + `createCollectionViaIpc` → `navigateToCollectionSettings` → wait for the form to settle (plural name shows 'Articles') → assert "Save changes" DISABLED → rename the plural name to 'Guides' and edit the description (leave the slugs untouched, a slug change is the schema-cascade flow and out of scope) → assert ENABLED → Save.
  Assert (desktop-only): the Save button is gated on `formState.isDirty`; the update reaches Core without throwing, shown by the redirect to the collection detail; a reload proves the rename persisted (re-read from Core, not an optimistic cache entry), shown by the sidebar listing the Collection under its new plural name 'Guides'. The sidebar link is scoped to the sidebar (a complementary landmark) so the matching breadcrumb crumb on the detail page does not make the locator ambiguous. Core's file and commit correctness are Core's tests.
  **Gate-fix note.** The original entry described this Save button as having NO isDirty gate and asked to pin that asymmetry. That asymmetry was a bug, not intended behavior, and is now fixed (`update.tsx` gates on `updateCollectionForm.formState.isDirty`, so collection update matches project and entry). The field-definition array is tracked in `isDirty` (adding or removing a field via the "Add Field" sheet flips the gate), so the gate does not block a legitimate field-only edit. See the app-wide dirty-gate convention in [`loading-and-updating-data.md`](./renderer/loading-and-updating-data.md).
  Helpers: `setUserViaIpc`, `createProjectViaIpc`, `createCollectionViaIpc`, `navigateToCollectionSettings`, `reloadWindow`.
  Deps: P0-03.

- **P1-12 Create an asset through the form and show its teaser. — DONE (passing, `tests/specs/assets.spec.ts`).**
  Steps: `setUserViaIpc` + `createProjectViaIpc` → `makeTempFile('logo.png', png)` → `stubFileDialog({ open: [thatPath] })` (**applied in main**) → `navigateToAssets` → the header "Add Asset" runs the stubbed picker and opens the Add Asset dialog with the name prefilled from the filename → fill "Asset description" → submit the dialog's "Add Asset" (scoped to the dialog, since the header trigger shares the label).
  Assert (desktop-only, per the doctrine): the create reaches Core without throwing, shown by the dialog closing, the "No Assets yet" empty state disappearing and the new teaser rendering (its un-slugified description text plus the teaser's "View"/"Delete" controls). The two-file model (`assets/{id}.json` + `lfs/{id}.{ext}`), the slugified name and the derived mime/extension/size are Core's own tests, not asserted here.
  Helpers: `setUserViaIpc`, `createProjectViaIpc`, `makeTempFile`, `stubFileDialog`, `navigateToAssets`.
  Deps: P0-01, `stubFileDialog`.

- **P1-13 Deleting a referenced asset is surfaced in place. — DONE (passing, `tests/specs/assets.spec.ts`).** _(the entry was split "IPC guard writable / UI deferred"; the UI half now landed via the in-place in-use modal, so the whole case is covered by one UI-driven spec)_
  Steps: `setUserViaIpc` + `createProjectViaIpc` → `makeTempFile('logo.png', pngBytes)` + `createAssetViaIpc` → `createCollectionViaIpc` with `[textFieldDefinition()` (required title)`, assetFieldDefinition()` (required asset reference)`]` → `createEntryViaIpc` referencing the Asset (`title` + `logo: assetReferenceValue(asset.id)`) → `navigateToAssets` → teaser Delete → the "You are about to delete this Asset" alertdialog → `confirmDialog(mainWindow, 'Delete')`.
  Assert (desktop-only, per the doctrine): Core blocks the delete with a `Conflict`, and the desktop app surfaces it **in place** through the "Could not delete this Asset" dialog (its `Conflict`-specific copy about the Asset being used by Entries), not the root error boundary. The fixture's console check confirms no error escaped, so no console escape hatch is needed (contrast the original deferred sketch, which assumed the boundary). Dismissing the modal (`dismissDialog`) leaves the Asset present (its teaser still renders) and the "No Assets yet" empty state absent, proving nothing was deleted. Core's guard logic and the intact on-disk files are Core's own tests, not asserted here.
  Helpers: `setUserViaIpc`, `createProjectViaIpc`, `makeTempFile`, `createAssetViaIpc`, `createCollectionViaIpc`, `textFieldDefinition`, `assetFieldDefinition`, `createEntryViaIpc`, `stringValue`, `assetReferenceValue`, `navigateToAssets`, `confirmDialog`, `dismissDialog`.
  Deps: P1-12. The asset-teaser in-place modal now exists (`asset-teaser.tsx`): the delete mutation overrides `throwOnError: false` and suppresses the wrapper toast, so the guard rejection is caught and turned into the modal (the third in-place instance after the force-delete and sync modals).

- **P1-14 Delete an unreferenced asset and return to the empty state. — DONE (passing, `tests/specs/assets.spec.ts`).**
  Steps: `setUserViaIpc` + `createProjectViaIpc` → `makeTempFile` + `createAssetViaIpc` → `navigateToAssets` → teaser "Delete" opens the "You are about to delete this Asset" alertdialog → `confirmDialog(mainWindow, 'Delete')`.
  Assert (desktop-only): the delete reaches Core without throwing, shown by the teaser disappearing (its description text is gone) and the "No Assets yet" empty state returning. Removal of both on-disk files and the delete commit are Core's own tests. Delete is an `AlertDialog` (`role="alertdialog"`), which is why `confirmDialog` was extended to match either role (see section 4).
  Helpers: `setUserViaIpc`, `createProjectViaIpc`, `makeTempFile`, `createAssetViaIpc`, `navigateToAssets`, `confirmDialog`.
  Deps: P1-12.

- **P1-15 Replace an asset's binary through the update flow. — DONE (passing, `tests/specs/assets.spec.ts`).**
  Steps: `setUserViaIpc` + `createProjectViaIpc` + `createAssetViaIpc(png)` → `navigateToAssets` → `makeTempFile('logo.jpg', jpg)` → `stubFileDialog({ open: [thatJpgPath] })` → teaser "Update" → assert the "Update" submit is DISABLED (nothing changed) → "Replace file" (stubbed picker) → the "New file: logo.jpg" hint appears and "Update" ENABLES → click "Update".
  Assert (desktop-only): the "Update" submit is dirty-gated (disabled until the file is replaced); the replace reaches Core without throwing, shown by the dialog closing and the teaser still rendering. The binary swap (png→jpg), the metadata re-derivation and the old-binary removal are Core's own tests, not asserted here.
  Helpers: `setUserViaIpc`, `createProjectViaIpc`, `createAssetViaIpc`, `makeTempFile`, `stubFileDialog`, `navigateToAssets`.
  Deps: P1-12.

- **P1-16 Save-as exports the asset to the chosen path. — DONE (passing, `tests/specs/assets.spec.ts`).**
  Steps: `setUserViaIpc` + `createProjectViaIpc` + `createAssetViaIpc` → `navigateToAssets` → `target = testInfo.outputPath('exported.png')` → `stubFileDialog({ save: target })` → teaser "Save as".
  Assert (desktop-only): the desktop drove the export to the user-chosen path, shown by polling until the target file exists on disk (runner-side `node:fs`) and is non-empty. This runner-side check of the export target (the path the user picked) is the flow's observable result and is allowed by the doctrine; byte-for-byte correctness of the exported file is Core's own test.
  Helpers: `setUserViaIpc`, `createProjectViaIpc`, `createAssetViaIpc`, `navigateToAssets`, `stubFileDialog`.
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

- **P2-01 First-run onboarding sets and persists the local User. — DONE (passing, `tests/specs/user.spec.ts`).**
  Steps: fresh app (no User) → `navigateToUserProfile` → fill "Full name" + "Email" (Port stays 31310, the local-API Switch stays OFF so the API never starts, that side effect is P2-11) → Save → `navigateToUserProfile` again.
  Assert (desktop-only, per the doctrine): the title is "Welcome to elek.io Desktop" and "Save local User" is DISABLED while no User exists; typing the name updates the live "Example change" commit preview (its author renders the typed name); the form dirties so Save ENABLES, and saving navigates to `/projects`. Persistence is proven by reopening the profile: the title is now "User profile" (a User exists) and "Full name" shows the entered value (the form reset from the saved User). The on-disk `user.json` and the `user:get` shape are Core's tests, not asserted here.
  Helpers: `navigateToUserProfile`.
  Deps: none.

- **P2-02 Edit an existing User persists. — DONE (passing, `tests/specs/user.spec.ts`).**
  Re-cast: the original asserted the new identity propagates to the git author, which is Core's test (Core stamps the author from the User). The desktop-relevant part is only that the edit persists and the form reflects it.
  Steps: `setUserViaIpc({ name: 'Test User', email: 'test@elek.io' })` → `navigateToUserProfile` → edit "Full name" to 'Renamed User' → Save → `navigateToUserProfile` again.
  Assert (desktop-only): the title is "User profile" (not Welcome), "Full name" shows 'Test User' (form reset from the existing User) and "Save local User" is DISABLED; editing the name ENABLES Save, and saving navigates to `/projects`; reopening the profile shows 'Renamed User' (persisted). The git author of the next commit is Core's test, dropped from this spec.
  Helpers: `setUserViaIpc`, `navigateToUserProfile`.
  Deps: P2-01.

- **P2-03 — DEFERRED (UI-negative). The recommended no-UI-path premise did not hold: a write-before-User path exists and hits the root error boundary.**
  Verifying the "no flow writes before a User is set" premise showed the app has **no onboarding gate**. With no User set, a fresh app redirects `/` → `/projects`, whose "Create Project" action opens `/projects/create` (neither route has a User `beforeLoad` gate and the list never blocks the action), and the create form submits `projects.create` directly. So there IS a UI path that writes before a User is set. Because `projects.create` uses the global `throwOnError: true` and is not handled in place, Core's `Unauthorized` rejection would reach the root error boundary. Under the doctrine (rule 1) a guard with a UI path is tested through the UI, and per the error-contract decision (section 5) a UI-driven mutation-negative that would assert the root `ErrorComponent` is deferred to the error-UX track. So this is deferred, not a no-UI-path IPC keep (contrast P1-09/P1-10). Separately worth recording: adding an onboarding gate (redirect to the profile until a User exists) is product work that would turn this into a blocked-in-UI path rather than a boundary hit.
  Deps: none.

- **P2-04 Project language management: the default cannot be removed and the supported set persists. — DONE (passing, `tests/specs/projects.spec.ts`).**
  Steps: `setUserViaIpc` + `createProjectViaIpc({ settings: { language: { default: 'en', supported: ['en', 'de'] } } })` → `navigateToProjectSettings` → click "Remove en" (the default) → `dismissDialog` → click "Remove de" → "Save changes" → `reloadWindow`.
  Assert (desktop-only, per the doctrine): removing the default `en` is blocked in place (the "Deleting the default language" dialog opens and the "Remove en" chip button stays); removing the non-default `de` drops its chip; saving the dirtied form persists the narrowed set, shown by a reload re-reading from Core with only "Remove en" present ("Remove de" gone). This guards the default-language remove guard and the supported-set persistence (the default-Select force-remount regression). The chip remove buttons are addressable because the Phase 0 a11y fix gave them accessible names ("Remove &lt;lang&gt;"). Core's on-disk `settings.language` shape is Core's test, not asserted here.
  Helpers: `setUserViaIpc`, `createProjectViaIpc`, `navigateToProjectSettings`, `dismissDialog`, `reloadWindow`.
  Deps: P0-01.

- **P2-05 Set the remote origin URL and reveal the Synchronize control. — DONE (passing, `tests/specs/projects.spec.ts`).**
  Steps: `setUserViaIpc` + `createProjectViaIpc` → `setupRemote({ mirror: <project path> })` (a reachable bare mirror, so the sidebar's getChanges stays console-clean) → `navigateToVersionControl` → fill "Remote URL" with `remote.url` → "Save changes".
  Assert (desktop-only, per the doctrine): "Save changes" is DISABLED with no origin and the sidebar shows no "Synchronize" button (it renders only when `remoteOriginUrl != null`); filling the URL ENABLES Save, and saving makes the "Synchronize" button appear (the origin reached Core) while the form resets back to the saved origin (Save re-gated). `project.remoteOriginUrl` on disk is Core's test.
  **Clearing half dropped (empirical, verified against Core).** The original also asked to clear the origin with an empty URL. The schema's `url` is a plain `ZodString`, so an empty submit passes validation and resolves, but it does NOT clear the origin: a follow-up `read` returns a non-null value (git leaves an `origin` remote behind rather than removing it), so `remoteOriginUrl != null` stays true and the "Synchronize" control would not disappear. There is no working "clear the origin" path through this form today, so that half is not forced. A real clear path (Core removing the remote, or the form sending a null / absent url) is follow-up product work.
  Helpers: `setUserViaIpc`, `createProjectViaIpc`, `setupRemote`, `navigateToVersionControl`.
  Deps: P0-01, `setupRemote`.

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

- **P2-10 — DEFERRED (UI-negative). The entry create form has no client-side uniqueness pre-check, so a duplicate unique value has a UI path that hits the root error boundary.** _(moved up from P3-07 — Core integrity guarantee, on par with reference integrity)_
  Verifying the entry CREATE form showed it validates with a static Core-generated zod schema (`getCreateEntrySchemaFromFieldDefinitions`) and does no cross-entry uniqueness check (`isUnique` appears only in the collection field-definition forms, never in the entry form). A unique field renders as a normal input, so a value duplicating an existing one can be submitted. Because `entries.create` uses the global `throwOnError: true` and is not handled in place, Core's `unique_collision` rejection would reach the root error boundary. So a UI path exists and, under the doctrine (rule 1) plus the error-contract decision (section 5), this is a deferred UI-negative pending the error-UX track, not a no-UI-path IPC keep (contrast P1-09/P1-10, which have genuinely no UI path).
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

- **P3-06 Asset form validation and update dirty-gate. — DONE (passing, `tests/specs/assets.spec.ts`).** _(added)_
  Steps: `setUserViaIpc` + `createProjectViaIpc` → `stubFileDialog({ open: [png] })` → `navigateToAssets` → Add Asset (name prefills from the filename) → submit with the description empty → then fill the description and submit → then open the created asset's Update dialog.
  Assert (desktop-only, per the doctrine): on submit with an empty description the field flips to `aria-invalid` "true" and nothing is created (the dialog stays open, the empty state is untouched behind it); filling the description lets the submit through (the dialog closes and a teaser renders). On the Update dialog the "Update" submit is DISABLED on open (the dirty gate) and ENABLES once the description is edited. `createAssetSchema`'s `min(1)` message text is Core's test, not asserted here; the reachable required error is the empty description, since the name is prefilled from the filename.
  Helpers: `setUserViaIpc`, `createProjectViaIpc`, `makeTempFile`, `stubFileDialog`, `navigateToAssets`.
  Deps: P1-12.

- **P3-07 Empty states across the app. — DONE (passing, `tests/specs/empty-states.spec.ts`).**
  Steps: walk all four in one spec in an order that keeps each precondition true: fresh app on `#/projects` → `setUserViaIpc` + `createProjectViaIpc` + `navigateToAssets` → `navigate` to the project's `collections` → `createCollectionViaIpc` + `navigateToCollection`.
  Assert (desktop-only): `No Projects yet`, `No Assets yet`, `No Collections found` (the collections sidebar), and `No results.` (the entry table) each render when their total is 0. This is the single place all four empty strings are pinned, so a renamed empty state is caught (the overlap with P1-17/P1-18 is intentional for that reason).
  Helpers: `createProjectViaIpc`, `navigateToAssets`, `createCollectionViaIpc`, `navigateToCollection`, `navigate`, `verifyCurrentRouteHash`.
  Deps: P0-01.

- **P3-08 Asset teaser View/preview dialog renders over the custom protocol. — DONE (passing, `tests/specs/assets.spec.ts`).** _(added; re-cast to UI observation)_
  Steps: `setUserViaIpc` + `createProjectViaIpc` → `makeTempFile('logo.png', pngBytes)` + `createAssetViaIpc({ name: 'logo' })` (a slug-safe name so the dialog title is predictable) → `navigateToAssets` → teaser "View".
  Assert (desktop-only, per the doctrine): the preview dialog opens with the Asset's name as its title, and the preview `<img>` inside the dialog actually loaded its bytes over the custom `elek-io-local-file:` protocol under the packaged CSP, shown by polling its `naturalWidth` > 0 (a failed protocol/CSP load leaves it 0). The img is scoped to the open dialog so it is the preview, not the teaser thumbnail behind it. The fixture's console assertion additionally guarantees no CSP/console error escaped. This is exactly the case the packaged-build launch exists to cover (see [`testing.md`](./testing.md#why-the-packaged-build)). Core's binary bytes are Core's own test.
  Helpers: `setUserViaIpc`, `createProjectViaIpc`, `makeTempFile`, `createAssetViaIpc`, `navigateToAssets`.
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

- **P3-11 Per-route accessibility assertions (opt-in). — STARTED (one route enforced, `tests/specs/accessibility.spec.ts`).**
  Landed: the Projects list (`#/projects`) asserts `expectNoAxeViolations` with `color-contrast` scoped out, so it enforces every other axe rule (including `button-name`, the rule Phase 0's accessible-name fixes address). The spec loops over a route list, so more routes join as they are cleaned.
  Discovery (axe legacy-mode scan per candidate route, after the Phase 0 accessible-name fixes and the `html-has-lang` fix):
  - `#/projects` (empty): `color-contrast` only → enforced with `color-contrast` disabled.
  - `#/projects/create`: `button-name` (the Radix Popover "Add language" trigger, `role="combobox"`), `color-contrast`.
  - `#/user/profile`: `button-name` (the Radix Select "Preferred language" trigger, `role="combobox"`), `color-contrast`, `link-in-text-block` (x2), `list`, `listitem`.
    Remaining burn-down before the fixture-wide assertion: the app-wide `color-contrast`; the two Radix combobox `button-name` cases (third-party widget internals / complex ARIA, needing an `aria-label` or a proper label association, out of this chunk's scope); and the profile's `link-in-text-block` / `list` / `listitem`. Each is why the full unscoped assertion is not yet possible on those routes.
    Helpers: `expectNoAxeViolations`.
    Deps: P0-01.

## 4. Helpers / fixtures to build first

Build these before their first consumer; ordered by dependency (each later helper tends to use the earlier ones).

**Status (implemented so far):** `tests/helpers/user.ts` (`setUserViaIpc`, `navigateToUserProfile`), `tests/helpers/project.ts` (`createProjectViaIpc`, `setRemoteOriginUrlViaIpc`, `fillProjectForm`, `createProject`, `navigateToProjectSettings`, `navigateToVersionControl`, `navigateToProjectDashboard`, `navigateToAssets`), `tests/helpers/collection.ts` (`createCollectionViaIpc`, `textFieldDefinition`, `emailFieldDefinition`, `referenceFieldDefinition`, `assetFieldDefinition`, `fillCollectionForm`, `addFieldDefinition`, `createCollection`, `navigateToCollection`/`navigateToCollectionCreate`/`navigateToCollectionSettings`), `tests/helpers/entry.ts` (`createEntryViaIpc`, `stringValue`, `referenceValue`, `assetReferenceValue`, `fillEntryForm`, `navigateToEntryCreate`, `navigateToEntryUpdate`), `tests/helpers/asset.ts` (`createAssetViaIpc`, `makeTempFile`, `pngBytes`, `jpegBytes`), `tests/helpers/dialog.ts` (`confirmDialog`, `dismissDialog`, `stubFileDialog`), `tests/helpers/navigation.ts` (`verifyCurrentRouteHash`, `reloadWindow`, `navigate`), `tests/helpers/remote.ts` (`setupRemote`, `remoteWorkSha`, `localWorkSha`, `deleteEntryOnRemote`), `tests/helpers/accessibility.ts` (`expectNoAxeViolations`), `tests/helpers/app.ts` (`relaunchApp`), the `launchApp` export in `tests/fixtures/electronApp.ts`, and `tests/global.d.ts`. Specs **P0-01 through P0-06, P0-08, P0-10, P0-11, P1-01, P1-07, P1-11, P1-12, P1-13, P1-14, P1-15, P1-16, P1-17, P1-18, P1-20, P1-21, P2-01, P2-02, P2-04, P2-05, P3-01, P3-05, P3-06, P3-07 and P3-08** are written, migrated to the doctrine, and passing (P0-07's and P0-09's IPC-level / commit-trailer guard tests were dropped as Core duplicates), and **P3-11** has landed its first enforced route in `tests/specs/accessibility.spec.ts`. Three Phase 0 accessibility fixes in app source support the role and name locators these specs use: the language-chip remove button (`project-form.tsx`) and the sidebar Synchronize-refresh button (`project-sidebar.tsx`) each gained an `sr-only` name, and `src/renderer/index.html` gained `lang="en"` (clearing the app-wide `html-has-lang` axe violation). The helpers below without a "(built)" tag are still to add.

**Naming:** the suite drives the UI by default, so UI helpers are unmarked and IPC helpers are suffixed `ViaIpc` (see [`testing.md`](./testing.md#writing-tests)). Pending entries below still use pre-convention names like `seedProject`; those become `createProjectViaIpc` and similar as each is migrated.

- **Typed IPC wrappers (built)** — thin helpers over the globally-typed `window.ipc`, each a small `page.evaluate` call, used to **arrange** state (`createProjectViaIpc`, `setUserViaIpc`). A single generic `ipc(page, path, ...args)` was intentionally **not** built: a stringly-typed dotted path cannot be typed without an `as any` cast, which the repo forbids. Per-operation wrappers stay fully type-safe and cast-free, mirroring the app's own `queries/options`. Because specs type-check under the Node tsconfig (no DOM lib), `window` is declared once in `tests/global.d.ts`; its `ipc` shape comes from the global augmentation in `src/index.d.ts`.
- **Read-back / disk helpers — dropped (not built).** An earlier plan had `dataDir` / `readDataFile` / `listProjects` / `projectHistory` and similar to assert Core's on-disk files and commits. The verification doctrine (section 1) removes those assertions from the desktop suite, so these helpers are not needed. Observe results through the UI (or a throw / no-throw on a seed/guard call) instead.
- **Console escape hatch (infra)** — extend the `mainWindow` fixture with an opt-in expected-console allow-list (or a per-spec teardown-skip). A prerequisite for UI-driven negative-path specs that reach the root error boundary (which logs via `console.error` + `core:logger:error`): P2-09, and any UI-driven failing create/update/delete that is not handled in place. Flows that handle the error in place (P0-11's force-delete modal, P1-21's sync-conflict modal, P1-13's asset-in-use modal) never reach the boundary and need no hatch. IPC-level negatives that await the rejected promise in `page.evaluate` are unaffected.
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
- **`confirmDialog(page, confirmName)` / `dismissDialog(page)` (built)** — the shared shadcn Dialog/AlertDialog flows (project/collection/asset deletes, clone dialog, default-language guard, asset view). `confirmDialog` scopes to the open dialog so the confirm button is not confused with the trigger that opened it; `dismissDialog` closes with Escape. `confirmDialog` matches either role, `getByRole('dialog').or(getByRole('alertdialog'))`, since the Asset delete uses an `AlertDialog` (`role="alertdialog"`); only one is ever open at a time, so the `.or` resolves to a single element and the existing `Dialog` callers keep working.
- **`expectToast(page, text)`** — assert Sonner success/error toasts after mutations. Remember: on failure today the toast fires **and** the root `ErrorComponent` renders (the boundary half is changing for expected errors, see section 5).
- **`stubFileDialog(electronApp, { open?, save? })` (built)** — `tests/helpers/dialog.ts`: **applied in the MAIN process** via `electronApp.evaluate(({ ipcMain }) => …)`. The dialog IPC handlers capture `dialog.showOpenDialog` / `showSaveDialog` by reference at registration (`main/index.ts`), so reassigning `dialog.showOpenDialog` at runtime does **not** intercept. Instead it `ipcMain.removeHandler(channel)` then `ipcMain.handle(channel, …)` to replace the handler with one returning a canned, non-cancelled result (`{ canceled: false, filePaths }` for open, `{ canceled: false, filePath }` for save). It cannot be applied in the renderer: `contextBridge.exposeInMainWorld` freezes `window.ipc` and the calls forward to main. Needed for every asset flow (P1-12, P1-15, P1-16, P3-06, P3-08).
- **`makeTempFile(testInfo, name, bytes)` (built)** — `tests/helpers/asset.ts`: write a source file under the test output (runner-side `node:fs`) for asset create/replace/save, returning its path. The extension of `name` sets Core's derived mimeType/extension (Core reads the type from the path via the `mime` package), so ships with `pngBytes` and `jpegBytes`, minimal valid 1x1 images whose bytes match a `.png`/`.jpg` name and load in the teaser preview without a console error. **`createAssetViaIpc(page, { projectId, filePath, name?, description? })` (built)** — `tests/helpers/asset.ts`: `core:assets:create` over IPC (`filePath` must be a real file from `makeTempFile`, sensible name/description defaults), to arrange an Asset for the delete/replace/save-as tests.
- **`setupRemote(testInfo, options?)` (built)** — `tests/helpers/remote.ts`: create a local **bare** git repo to act as origin for synchronize/clone/getChanges and the two `project.delete` remote guards. Runs on the runner via the system `git` (`git init --bare`, or `git clone --bare <mirror>` to seed it level with an existing repo). Returns `{ path, url }` where `url` is the absolute bare path (dugite accepts it directly). Reliable for commit/ref round-trips; see the LFS caveat in section 5.
- **`remoteWorkSha(remotePath)` / `localWorkSha(dir)` (built)** — `tests/helpers/remote.ts`: read the `work` branch SHA of a bare remote (`git ls-remote`) or a local repo (`git rev-parse`). Comparing them corroborates a sync round-trip (P1-20) or that a rejected sync pushed nothing (P1-21). This observes only the ref, not file contents, so it stays within the desktop verification doctrine (the runner-side git check the doctrine allows).
- **`deleteEntryOnRemote(testInfo, remotePath, relPath)` (built)** — `tests/helpers/remote.ts`: clone the bare to a throwaway working tree, `git rm` the Entry file on `work`, commit (with an inline identity so the runner needs no global git config), and push `work` back to the bare. Arranges a remote whose `work` tree already holds a dangling reference, a state Core's own delete gate would never produce, so a following local `synchronize` hits the sync-time integrity gate (P1-21).
- **`referenceFieldDefinition(overrides?)` (built)** — `tests/helpers/collection.ts`: an optional single-entry reference `FieldDefinition` (`fieldType: 'entry'`, `ofCollections: []` = any, `max: 1`), the counterpart of `textFieldDefinition`/`emailFieldDefinition` for arranging Collections whose Entries point at one another. **`referenceValue(entryId?, collectionId?)` (built)** — `tests/helpers/entry.ts`: the matching Entry Value builder; with both ids it points at one target Entry (carrying `collectionId`, which Core's storage needs), with no args it builds an empty reference (Core still requires the value wrapper for an optional reference field).
- **`assetFieldDefinition(overrides?)` (built)** — `tests/helpers/collection.ts`: a required single-asset reference `FieldDefinition` (`fieldType: 'asset'`, `ofAssetMimeTypes: []` = any type, `min`/`max` 1), for arranging a Collection whose Entries reference an Asset. **`assetReferenceValue(assetId)` (built)** — `tests/helpers/entry.ts`: the matching Value builder pointing at one Asset; unlike `referenceValue` it carries only the target `id` (no `collectionId`, since Assets live at the Project root, not inside a Collection). Together they arrange the referenced-Asset delete guard in P1-13.
- **`apiRequest(playwright)` (runner-side)** — a Playwright `APIRequestContext` (`request.newContext()`) to probe the local API from Node (P2-11), since the renderer's custom-protocol origin cannot reach `http://localhost`.
- **`expectNoAxeViolations(page, options?)` (built)** — `tests/helpers/accessibility.ts`: opt-in per-route accessibility assertion ahead of the fixture-wide enforcement the `@todo` defers. Runs the axe legacy-mode scan (legacy mode is required, see the fixture) and asserts no violations, surfacing the failing rule ids so a regression is debuggable. `options.disableRules` scopes out rules a route does not pass yet (the app-wide `color-contrast`), so a route can enforce every other rule now; omit it for a full scan once a route is fully clean. First consumer: **P3-11**.

## 5. Known constraints and things deliberately out of scope

- **Error contract and test-sequencing decision.** Every mutation built through `customMutationOptions` gets `throwOnError: true` (`util.ts:72`). On failure `onError` shows a `toast.error` and logs via `core:logger:error` (`util.ts:122`), and independently `throwOnError` re-throws in the render phase. Because only `__root.tsx` defines an `errorComponent`, that re-throw replaces the whole view with the root error screen (whose only exits are Back-to-Projects and Reload). So there is no "toast shows and the source route stays" state today. **Product decision:** this full-view takeover is a reasonable v1 catch-all but the wrong response to expected, recoverable Core errors (the 400/409/412 guards raised by normal user actions). Handling those in place (stay on the page plus toast, inline errors, or a follow-up modal) is a separate track, and the force-delete modal (P0-11, now landed) is its first instance. **Sequencing (decided): decouple.** Do not pin the boundary takeover for expected mutation errors. Happy-path specs and IPC-level negatives proceed now. UI-driven mutation-negative specs that would assert the root error screen wait until the error-UX track handles their case. Three in-place instances have now landed, each using a per-call `throwOnError: false` override to catch the rejection and show a dialog instead of the boundary: the force-delete modal (**P0-11**), the sync-conflict modal (**P1-21**), and the asset-in-use modal (**the UI half of P1-13**). Route-load and not-found boundary behavior (**P2-09**) is not part of this change and stays as-is.
- **Strict console assertion.** The `mainWindow` fixture fails on any console error/warning on a passing test. UI-driven negative-path specs must use the console escape hatch, or they are unwritable. This is scoped in section 4 as a build-first prerequisite.
- **Native file-picker dialogs.** `electron:dialog:*` cannot be driven by Playwright and cannot be stubbed from the renderer (frozen contextBridge, handled in main). All asset flows depend on the main-process `stubFileDialog`.
- **git-lfs binary transfer over a plain remote.** A vanilla bare/`file://` remote carries LFS **pointers** but not LFS **objects** without an LFS endpoint or a configured standalone transfer agent. Assertions that an LFS binary round-trips (P1-20) or that binaries are materialized after clone (P2-12) are **out of scope** unless Core is confirmed to configure a `file://`/standalone LFS transfer. The non-LFS commit/metadata round-trip is fully in scope.
- **Local API reachability.** The local API runs in the main process with localhost-only CORS; probe it from the Node runner side via `APIRequestContext`, never from renderer `fetch`.
- **Renderer reload vs process restart.** `reloadWindow` (`page.reload()`) reloads only the renderer; use `relaunchApp` (close + relaunch against the same `ELEK_IO_DATA_DIR`) for true cross-restart persistence (P0-10).
- **Fixed — `general.tsx` UI delete now has a force fallback (P0-11).** The delete used to call `deleteProject({ id })` with **no `force`**; a local-only project always hit Core's guard (`412`/`409`) and, via the global `throwOnError: true`, detonated the root error boundary, so it could never be deleted through the UI. The delete mutation now overrides `throwOnError: false` at the call site and suppresses the wrapper's error toast, so the rejection is caught and opens a force-delete confirmation dialog that re-issues the delete with `{ force: true }`. This is the first landed instance of the in-place error-UX handling described above.
- **Fixed — `project-sidebar.tsx` Synchronize now surfaces a failed sync in place (P1-21).** The sidebar Synchronize used to `await synchronizeProject({ id })` with the global `throwOnError: true`, so any sync rejection (most importantly Core's sync-time integrity gate rejecting a rebase that would push a dangling reference) detonated the root error boundary. The synchronize mutation now overrides `throwOnError: false` at the call site and suppresses the wrapper's error toast, and the `onClick` catches the rejection and opens a controlled "Could not synchronize this Project" dialog explaining nothing was pushed. This is the second landed instance of the in-place error-UX handling, after the force-delete modal. The title is generic on purpose, so it covers a `Conflict` (dangling reference), an LFS-endpoint failure, or a network outage without discriminating error types. See the pattern in [`error-handling.md`](./error-handling.md#handling-expected-errors-in-place).
- **Fixed — `asset-teaser.tsx` Delete now surfaces a blocked (in-use) delete in place (P1-13, UI half).** The teaser Delete used to call `deleteAsset({ ...props })` with the global `throwOnError: true`, so deleting an Asset an Entry still references (Core's `Conflict` guard) detonated the root error boundary. The delete mutation now overrides `throwOnError: false` at the call site and suppresses the wrapper's error toast; the teaser's "You are about to delete this Asset" alertdialog fires the delete, and its `catch` opens a separate controlled "Could not delete this Asset" dialog whose `Conflict` copy tells the user to remove or repoint the references first. Nothing is deleted, so the teaser stays on the page. This is the third landed instance of the in-place error-UX handling, after the force-delete and sync-conflict modals. See the pattern in [`error-handling.md`](./error-handling.md#handling-expected-errors-in-place).
- **No unit runner.** There is no non-E2E path to exercise Core in isolation; all Core behavior is reached through the running packaged app via `window.ipc`.
