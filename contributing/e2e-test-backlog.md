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

- The per-test data dir is computed inside the fixture and never exported. Surface it (`dataDir(testInfo)` / `readDataFile` / `listDataDir`) so specs can assert Core's storage layout.
- **Console escape hatch is a prerequisite for _every_ UI-driven negative-path spec, not just the error-boundary case.** The `mainWindow` fixture asserts zero console errors/warnings on pass (`electronApp.ts:150`). Because failed mutations hit the root error boundary, React logs the caught error to `console.error` and the app logs via `core:logger:error`. Add an opt-in expected-console allow-list before writing P0-11, P1-13, P2-09, or any UI-driven failing create/update/delete. IPC-level negatives that `await` a rejected promise inside `page.evaluate` (P0-07, P0-08, P1-04, P1-05, P1-06, P1-09, P1-10, P2-03, P2-10) do **not** trip this and need no escape hatch.
- **Native `electron:dialog:*` modals must be stubbed in the MAIN process,** not the renderer. `contextBridge.exposeInMainWorld` freezes the exposed `window.ipc`, and the dialog calls forward to Electron's `dialog.showOpenDialog/showSaveDialog` in main. The stub is applied with `electronApp.evaluate(({ dialog }) => …)`. This affects every asset flow (P1-12, P1-15, P1-16, P3-06, P3-08).
- **A controllable git origin (`setupRemote`)** — a local bare repo — is needed for synchronize/clone/getChanges and the two `project.delete` remote guards.

## 2. Coverage matrix / gap summary

Existing coverage (the one spec): app launch, `#app` visible, title, `/ → /projects` redirect, plus the implicit per-pass checks (zero console errors/warnings; axe scan runs but does not assert). Everything marked "gap" is uncovered.

| IPC channel                                                                  | Existing coverage       | Backlog IDs                                         |
| ---------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------- |
| projects:create                                                              | gap                     | P0-01, P0-02, P0-09, P2-03, P3-01                   |
| projects:list / count                                                        | gap                     | P0-01, P1-17, P1-19, P3-07                          |
| projects:read                                                                | gap                     | P0-02, P2-06                                        |
| projects:history                                                             | gap                     | P0-09, P2-06, P2-07                                 |
| projects:update                                                              | gap                     | P1-01, P2-04                                        |
| projects:delete                                                              | gap                     | P0-07, P0-08, P0-11 (UI, deferred), P0-10(indirect) |
| projects:getChanges                                                          | gap                     | P1-20, P2-05, P2-13                                 |
| projects:setRemoteOriginUrl                                                  | gap                     | P2-05, P1-20, P2-13                                 |
| projects:synchronize                                                         | gap                     | P1-20, P1-21, P2-13                                 |
| projects:clone                                                               | gap                     | P2-12                                               |
| collections:list                                                             | gap                     | P0-03, P1-18, P3-07                                 |
| collections:create                                                           | gap                     | P0-03                                               |
| collections:read                                                             | gap                     | P0-03, P0-06                                        |
| collections:update                                                           | gap                     | P1-02, P1-03, P1-04, P1-05, P1-06, P1-11            |
| collections:delete                                                           | gap                     | P0-06                                               |
| entries:list                                                                 | gap                     | P0-04, P1-18, P3-07                                 |
| entries:create                                                               | gap                     | P0-04, P1-10, P2-15, P3-05, P3-06(ref), P2-10       |
| entries:read                                                                 | gap                     | P0-05, P1-08                                        |
| entries:update                                                               | gap                     | P1-07, P1-08                                        |
| entries:delete                                                               | gap (no UI; IPC-only)   | P1-09                                               |
| assets:list                                                                  | gap                     | P1-12, P3-07                                        |
| assets:create                                                                | gap                     | P1-12                                               |
| assets:read                                                                  | gap                     | P1-12, P1-16, P3-08                                 |
| assets:update                                                                | gap                     | P1-15, P3-06                                        |
| assets:delete                                                                | gap                     | P1-13, P1-14                                        |
| assets:save                                                                  | gap                     | P1-16                                               |
| user:get / set                                                               | gap                     | P2-01, P2-02, P2-03 (setUser helper)                |
| api:start / stop / isRunning                                                 | gap                     | P2-11                                               |
| logger:*                                                                     | indirect only           | (exercised via P2-09; no dedicated case)            |
| electron:dialog:showOpen/showSave                                            | native, stubbed in main | P1-12, P1-15, P1-16, P3-06, P3-08                   |
| i18n / date-fns locale rendering                                             | gap                     | P2-14                                               |
| App launch / title / `/`→`/projects`                                         | **covered**             | —                                                   |
| Redirect chains ($projectId→dashboard, $entryId→update, settings/user index) | gap                     | P2-08                                               |
| Root not-found + error boundary                                              | gap                     | P2-09                                               |
| Global chrome (versions, back/forward, breadcrumbs)                          | gap                     | P3-10                                               |

## 3. Prioritized backlog

> **Assertion migration in progress.** These entries were first written before the verification doctrine (section 1) was settled, so many still describe on-disk `*.json` and commit-trailer assertions. Those are Core's tests, not the desktop's. As each test is implemented, its assertions are re-cast to the doctrine: drive via UI, observe throw / no-throw, assert the UI reflects the result. P0-01 has been migrated and is the reference; the wording of the others will be updated as they are picked up.

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

- **P0-03 Create a collection with a field definition and verify it persists.**
  Steps: `setUser` + `seedProject` → `collections/create` → fill icon/name/slug → add a required text field → Create.
  Assert: `collection.json` on disk with per-language translatable name, slug, and the text field (stable id); appears in `collections:list`; sidebar lists it; create commit exists.
  Helpers: `seedProject`, `addFieldDefinition`, `navigateToProject`, `dataDir`, `ipc`.
  Deps: P0-01.

- **P0-04 Create an entry and verify values persist keyed by slug.**
  Steps: `setUser` + `seedProject` + `seedCollection(required text)` → `collection/create` → fill entry form → Create.
  Assert: `{entryId}.json` with objectType `entry`, `values.<slug>.content.<lang>`; row in `EntryTable`; commit carries `Object-Type:entry` + `Collection-Id` trailer.
  Helpers: `seedCollection`, `fillEntryForm`, `dataDir`, `ipc`.
  Deps: P0-03.

- **P0-05 Entry survives a renderer reload.**
  Steps: seed user+project+collection+entry → `reloadWindow` → assert row still present and `entries:read` returns the same values.
  Note: same renderer-only caveat as P0-02.
  Helpers: `seedEntry`, `reloadWindow`, `ipc`.
  Deps: P0-04.

- **P0-06 Delete a collection cascades to its entries.**
  Steps: seed collection + 1 entry → `collection/update` → Delete Collection → `confirmDialog`.
  Assert: navigate to `/collections`; folder (including the entry file) gone from disk; `collections:list` total decremented; delete commit exists.
  Helpers: `seedCollection`, `seedEntry`, `confirmDialog`, `dataDir`, `ipc`.
  Deps: P0-04.

- **P0-07 `project.delete` no-origin guard blocks a local-only project (IPC).**
  Steps: `seedProject` (no remote) → `ipc('core.projects.delete', { id })` (no force) rejects `PreconditionFailed(412)` and the folder still exists → retry with `{ force: true }` removes the folder and decrements the list.
  Helpers: `seedProject`, `ipc`, `dataDir`.
  Deps: P0-01. No remote needed — cheapest high-value data-loss test.

- **P0-08 `project.delete` unpushed-ahead guard blocks a project with local-only commits (IPC).** _(added — distinct from P0-07)_
  Steps: `setupRemote` → seed project → set remote origin → make a local change so `work` is ahead of the remote → `ipc('core.projects.delete', { id })` (no force) rejects `Conflict(409)` and the folder still exists → retry with `{ force: true }` deletes.
  Assert: without force the destruction is blocked while unpushed work exists; with force it proceeds.
  Helpers: `setupRemote`, `seedProject`, `ipc`, `dataDir`.
  Deps: P0-07, `setupRemote`.

- **P0-09 Git commit trailers and author are correct across object types.**
  Steps: `setUser` (known name/email) → create project, collection, entry via UI → `getHistory`.
  Assert: each commit carries the right `Method`/`Object-Type`/`Object-Id`; the entry commit adds `Collection-Id`; ordering is newest-first; author matches the configured user.
  Helpers: `setUser`, `createProjectViaUi`, `addFieldDefinition`, `fillEntryForm`, `getHistory`.
  Deps: P0-01, P0-03, P0-04.

- **P0-10 True cross-process-restart persistence.** _(added — closes the reloadWindow gap)_
  Steps: seed user+project+collection+entry → **close and relaunch `electronApp` against the same `ELEK_IO_DATA_DIR`** → assert `projects:read` / `entries:read` return the seeded data and the UI renders it.
  Assert: content survives a full main-process + Core restart, not just a renderer reload.
  Helpers: `relaunchApp` (new infra — see section 4; the default fixture computes a fresh per-test dir, so the helper must reuse the recorded dir).
  Deps: P0-05, `relaunchApp`.

- **P0-11 UI force-delete fallback modal — DEFERRED, blocked on the modal (do not implement yet).**
  Intended behavior: `settings/general` Delete calls `deleteProject({ id })`; when Core rejects with `PreconditionFailed(412)` (no origin) or `Conflict(409)` (unpushed commits), Desktop opens a force-delete confirmation modal, and confirming re-issues the delete with `{ force: true }`. Core already enforces these guards; only the Desktop modal is missing (see section 5).
  Steps (once built): `setUser` + `seedProject` (local-only) → settings/general → Delete → confirm the first dialog → assert the force-delete modal appears → confirm it.
  Assert: the plain delete surfaces the modal (not the root `ErrorComponent`); confirming force removes `projects/{id}` from disk and navigates to `/projects`; dismissing the modal leaves the project intact.
  Helpers: `setUser`, `seedProject`, `confirmDialog`, `expectToast`, `dataDir`, console escape hatch (the caught 412/409 may still log).
  Deps: P0-07; **blocked on the Desktop force-delete modal in `general.tsx`**. Write only after that modal ships.

### P1 — rest of CRUD, content integrity, assets, sync

- **P1-01 Update a project persists and is dirty-gated.**
  Steps: `seedProject` → settings/general → assert Save disabled until dirty → edit name → Save.
  Assert: `project.json` name changed, `updated` non-null, update commit appears.
  Helpers: `seedProject`, `dataDir`, `getHistory`.
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

- **P1-07 Update an entry persists and is dirty-gated.**
  Steps: seed entry → `entry/update` → assert Update disabled until dirty → edit a value → Update.
  Assert: entry json changed, `updated` non-null, update commit, navigate back to list.
  Helpers: `seedEntry`, `fillEntryForm`, `dataDir`, `getHistory`.
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

- **P1-11 UI collection update happy path, and pin the missing isDirty gate.** _(added — P1-02..06 are all IPC-only)_
  Steps: seed collection → `/collections/$collectionId/update` → edit name/description via `CollectionForm` → Save changes.
  Assert: navigates to the collection detail; `collection.json` updated; **the Save button has NO isDirty gate** (asymmetric with project/entry saves — pin this so a future half-wired gate is caught).
  Helpers: `seedCollection`, `addFieldDefinition`, `dataDir`.
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

- **P1-17 Projects list empty vs populated.**
  Steps: fresh app → assert Empty `No Projects yet` → `seedProject` → reload/nav.
  Assert: one card with title + description; skeletons resolved.
  Helpers: `seedProject`, `reloadWindow`.
  Deps: P0-01.

- **P1-18 Entry table lists entries with formatted columns.**
  Steps: seed collection + 2 entries → collection detail.
  Assert: 2 rows; `No results.` absent; column-visibility dropdown present; Create button labeled with the singular name.
  Helpers: `seedCollection`, `seedEntry`.
  Deps: P0-04.

- **P1-19 Reload lists multiple projects without duplication or loss.** _(moved down from P0-09 — list-render/count integrity, no data-loss risk)_
  Steps: seed 3 projects → `reloadWindow`.
  Assert: exactly 3 cards and `projects:count === 3`.
  Helpers: `seedProject`, `reloadWindow`, `ipc`.
  Deps: P0-01.

- **P1-20 Synchronize round-trip drives ahead/behind to zero (needs bare remote).**
  Steps: `setupRemote` → seed user+project → set remote origin via version-control settings → make an update (creates ahead) → sidebar Synchronize.
  Assert: `getChanges` ahead + behind both 0; the bare remote received the commits (`git ls-remote`).
  **LFS caveat:** the non-LFS metadata/commit round-trip is the reliable assertion. Verifying that an LFS **binary** round-trips over a plain bare/`file://` remote is _not_ reliable without an LFS endpoint or a configured standalone transfer agent — a vanilla bare repo carries the pointer but not the object. Only assert LFS-object transfer after confirming Core configures a standalone/`file://` LFS transfer; otherwise treat LFS-object round-trip as out of scope here (see section 5).
  Helpers: `setupRemote`, `setUser`, `seedProject`, `ipc`, `getHistory`.
  Deps: P0-01, `setupRemote`.

- **P1-21 Synchronize integrity gate: a rebase that orphans a reference target stops the sync and does NOT push (needs bare remote).** _(added — the highest-ranked sync risk, previously uncovered)_
  Steps: `setupRemote` with a project + entries where one references another → produce a remote commit that, after rebase, leaves the local `work` tree with a dangling reference (delete the target on the remote side, add a local commit) → sidebar Synchronize.
  Assert: sync rejects `Conflict(409)` for the dangling reference; nothing is pushed (the bare remote's ref is unchanged via `git ls-remote`); local state is not left mid-rebase.
  Helpers: `setupRemote`, `ipc`, `getHistory`.
  Deps: P1-20, `setupRemote`. A regression here would ship a corrupt tree to the shared remote for every collaborator — highest sync value.

### P2 — settings, user identity, uniqueness, history, navigation, local API, i18n

- **P2-01 First-run user onboarding sets and persists identity.**
  Steps: fresh app → `/user/profile` → assert Welcome title (user null) → fill language/name/email/port, toggle local API → Save.
  Assert: navigate `/projects`; `user.json` written matching input; `user:get` returns it; UserDropdown renders; live commit preview updates as name/email change.
  Helpers: `ipc`, `dataDir`.
  Deps: none.

- **P2-02 Edit an existing user and confirm identity propagates to the git author.** _(added — P2-01 covers only first-run)_
  Steps: `setUser` → `/user/profile` (asserts the form resets from the existing user, not the Welcome state) → change name/email/language → Save → make a commit (e.g. `seedProject` via UI).
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

- **P3-01 Project form validation on submit.**
  Steps: `/projects/create` → Create with empty name + description.
  Assert: `FormMessage` errors; no submit-disable; no errors on open; no project written.
  Helpers: `dataDir`.
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

- **P3-05 Entry required and format validation per language.**
  Steps: collection with a required email field → entry create submit empty → required error; invalid email → format error; valid value passes.
  Assert: Create stays dirty-gated; errors are per language.
  Helpers: `seedCollection`, `fillEntryForm`.
  Deps: P0-04.

- **P3-06 Asset form validation and update dirty-gate.** _(added)_
  Steps: assets route → `stubFileDialog({ open → temp })` → Add Asset with empty description (description is `min(1)`) → submit → assert blocked with a message; fill it → succeeds. Then on an existing asset's Update form, assert the Update button is isDirty-gated.
  Helpers: `stubFileDialog`, `makeTempFile`, `seedProject`.
  Deps: P1-12.

- **P3-07 Empty states across the app.**
  Assert: `No Projects yet`, `No Assets yet`, `No Collections found` (sidebar), and `No results.` (entry table) each render when their total is 0.
  Helpers: `seedProject` (for the scoped-empty cases).
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

**Status (implemented so far):** `tests/helpers/user.ts` (`setUserViaIpc`), `tests/helpers/project.ts` (`createProjectViaIpc`, `fillProjectForm`, `createProject`), and `tests/global.d.ts`. Spec **P0-01** is written, migrated to the doctrine, and passing. The helpers below without a "(built)" tag are still to add.

**Naming:** the suite drives the UI by default, so UI helpers are unmarked and IPC helpers are suffixed `ViaIpc` (see [`testing.md`](./testing.md#writing-tests)). Pending entries below still use pre-convention names like `seedProject`; those become `createProjectViaIpc` and similar as each is migrated.

- **Typed IPC wrappers (built)** — thin helpers over the globally-typed `window.ipc`, each a small `page.evaluate` call, used to **arrange** state (`createProjectViaIpc`, `setUserViaIpc`). A single generic `ipc(page, path, ...args)` was intentionally **not** built: a stringly-typed dotted path cannot be typed without an `as any` cast, which the repo forbids. Per-operation wrappers stay fully type-safe and cast-free, mirroring the app's own `queries/options`. Because specs type-check under the Node tsconfig (no DOM lib), `window` is declared once in `tests/global.d.ts`; its `ipc` shape comes from the global augmentation in `src/index.d.ts`.
- **Read-back / disk helpers — dropped (not built).** An earlier plan had `dataDir` / `readDataFile` / `listProjects` / `projectHistory` and similar to assert Core's on-disk files and commits. The verification doctrine (section 1) removes those assertions from the desktop suite, so these helpers are not needed. Observe results through the UI (or a throw / no-throw on a seed/guard call) instead.
- **Console escape hatch (infra)** — extend the `mainWindow` fixture with an opt-in expected-console allow-list (or a per-spec teardown-skip). A prerequisite for **every** UI-driven negative-path spec (failed mutations hit the root error boundary, which logs via `console.error` + `core:logger:error`): P0-11 (the deferred UI force-delete flow), P1-13, P2-09, and any UI-driven failing create/update/delete. IPC-level negatives that await the rejected promise in `page.evaluate` are unaffected.
- **`setUserViaIpc(page, overrides?)` (built)** — `core:user:set` precondition (git author identity); returns the User. Narrowed to the local-User branch of the `SetUserProps` union. Required before any write.
- **`createProjectViaIpc(page, overrides?)` (built)** — `core:projects:create` with sensible defaults, returns the Project. The IPC-seed counterpart of `createProject`.
- **`createProject(page, props)` + `fillProjectForm` (built)** — click through from the Projects list, fill name + description, submit, and return the new projectId from the redirect URL. A `selectProjectLanguage` helper for the custom language Popover/Command widget is still to add (the default en/en is used until then).
- **`seedCollection(page, { projectId, name, slug, fieldDefinitions })`** — `core:collections:create` with caller-supplied field-definition ids; returns collectionId.
- **`addFieldDefinition(page, valueType, config)`** — drive the value-definition sub-forms inside the `CollectionForm` sheet (text/number/select/reference/markdown/date/etc.) for UI-level collection and validation tests.
- **`seedEntry(page, { projectId, collectionId, values })` + `fillEntryForm(page, fieldDefinitions, values)`** — create entries via `core:entries:create` or by populating the dynamically generated entry form keyed by slug/language; `fillEntryForm` must handle the per-language translatable dialog (P2-15) and temporal fields (P2-14).
- **`navigateToProject/Collection/Entry(page, ids)`** — route to the target and confirm the hash via `verifyCurrentRouteHash`.
- **`reloadWindow(page)`** — `page.reload()` then wait for `#app` and the expected hash. Basis of the renderer-refetch persistence cases (P0-02, P0-05, P1-17, P1-19). **Note its scope:** it reloads only the renderer; main + Core stay alive, so it proves renderer re-fetch over IPC, not process-restart survival.
- **`relaunchApp(testInfo)` (infra, for P0-10)** — record the per-test `ELEK_IO_DATA_DIR`, `electronApp.close()`, then relaunch a new Electron app with the **same** `ELEK_IO_DATA_DIR` (and a fresh or reused `--user-data-dir`). The default fixture computes a fresh dir per test, so this helper must reuse the recorded one. The only way to test true survival across a main-process restart.
- **`getHistory(page, projectId)`** — read `core:projects:history` to assert commit subjects, trailers, order, and author.
- **`confirmDialog(page, confirmName)` / `dismissDialog(page)`** — the shared shadcn Dialog/AlertDialog flows (project/collection/asset deletes, clone dialog, default-language guard, asset view).
- **`expectToast(page, text)`** — assert Sonner success/error toasts after mutations. Remember: on failure today the toast fires **and** the root `ErrorComponent` renders (the boundary half is changing for expected errors, see section 5).
- **`stubFileDialog(page/electronApp, { open?, save? })`** — **applied in the MAIN process** via `electronApp.evaluate(({ dialog }) => …)`, overriding `dialog.showOpenDialog` / `dialog.showSaveDialog` to return canned paths. It cannot be applied in the renderer: `contextBridge.exposeInMainWorld` freezes `window.ipc` and the calls forward to main. Needed for every asset flow (P1-12, P1-15, P1-16, P3-06, P3-08).
- **`makeTempFile(testInfo, name, bytes)`** — write a source file under the test output for asset create/replace/save.
- **`setupRemote(testInfo)`** — create a local **bare** git repo to act as origin for synchronize/clone/getChanges and the two `project.delete` remote guards. Reliable for commit/ref round-trips; see the LFS caveat in section 5.
- **`apiRequest(playwright)` (runner-side)** — a Playwright `APIRequestContext` (`request.newContext()`) to probe the local API from Node (P2-11), since the renderer's custom-protocol origin cannot reach `http://localhost`.
- **`expectNoAxeViolations(page)`** — opt-in per-route accessibility assertion ahead of the fixture-wide enforcement the `@todo` defers.

## 5. Known constraints and things deliberately out of scope

- **Error contract and test-sequencing decision.** Every mutation built through `customMutationOptions` gets `throwOnError: true` (`util.ts:72`). On failure `onError` shows a `toast.error` and logs via `core:logger:error` (`util.ts:122`), and independently `throwOnError` re-throws in the render phase. Because only `__root.tsx` defines an `errorComponent`, that re-throw replaces the whole view with the root error screen (whose only exits are Back-to-Projects and Reload). So there is no "toast shows and the source route stays" state today. **Product decision:** this full-view takeover is a reasonable v1 catch-all but the wrong response to expected, recoverable Core errors (the 400/409/412 guards raised by normal user actions). Handling those in place (stay on the page plus toast, inline errors, or a follow-up modal) is a separate track, and the force-delete modal (P0-11) is its first instance. **Sequencing (decided): decouple.** Do not pin the boundary takeover for expected mutation errors. Happy-path specs and IPC-level negatives (which assert Core's rejection directly and are independent of UI presentation) proceed now. UI-driven mutation-negative specs that assert the root error screen are deferred until the error-UX track lands: currently **P0-11** and the **UI half of P1-13**. Route-load and not-found boundary behavior (**P2-09**) is not part of this change and stays as-is.
- **Strict console assertion.** The `mainWindow` fixture fails on any console error/warning on a passing test. UI-driven negative-path specs must use the console escape hatch, or they are unwritable. This is scoped in section 4 as a build-first prerequisite.
- **Native file-picker dialogs.** `electron:dialog:*` cannot be driven by Playwright and cannot be stubbed from the renderer (frozen contextBridge, handled in main). All asset flows depend on the main-process `stubFileDialog`.
- **git-lfs binary transfer over a plain remote.** A vanilla bare/`file://` remote carries LFS **pointers** but not LFS **objects** without an LFS endpoint or a configured standalone transfer agent. Assertions that an LFS binary round-trips (P1-20) or that binaries are materialized after clone (P2-12) are **out of scope** unless Core is confirmed to configure a `file://`/standalone LFS transfer. The non-LFS commit/metadata round-trip is fully in scope.
- **Local API reachability.** The local API runs in the main process with localhost-only CORS; probe it from the Node runner side via `APIRequestContext`, never from renderer `fetch`.
- **Renderer reload vs process restart.** `reloadWindow` (`page.reload()`) reloads only the renderer; use `relaunchApp` (close + relaunch against the same `ELEK_IO_DATA_DIR`) for true cross-restart persistence (P0-10).
- **Known bug, fix planned — `general.tsx` UI delete has no force fallback (test deferred, see P0-11).** `general.tsx` `onDelete` calls `deleteProject({ id })` with **no `force`**, then navigates. A freshly created local-only project has no remote, so the call always hits Core's no-origin `PreconditionFailed(412)` guard (and a project with unpushed commits hits the `Conflict(409)` guard), so it can **never** be deleted through the UI today — the navigate is unreachable. **Decision:** when the plain delete is rejected, Desktop will open a force-delete confirmation modal that re-issues the delete with `{ force: true }` on confirm. Core already enforces the guards; only the Desktop modal is missing. Do **not** write the UI delete test (P0-11) until that modal exists — until then there is no correct passing behavior to assert. The IPC-level guard tests (P0-07, P0-08) are independent of the modal and can be written now.
- **No unit runner.** There is no non-E2E path to exercise Core in isolation; all Core behavior is reached through the running packaged app via `window.ipc`.
