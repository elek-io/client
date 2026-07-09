# @elek-io/desktop

## 0.3.4

### Patch Changes

- afeae99: Rework the release pipeline and harden CI/CD.

  CD now produces a single draft GitHub Release per version with the changelog as its body, replacing the several empty drafts a release used to create. A new prepare-release job creates that one draft up front, and the build only runs for a genuinely new version, so an ordinary changeset-free push to main no longer rebuilds or overwrites an existing release. macOS publishes per-architecture update channels (latest-x64-mac.yml and latest-arm64-mac.yml) so the Intel and Apple Silicon runners no longer overwrite each other's update metadata.

  CI cancels superseded runs, uses a read-only token, and runs on reopened pull requests. Dependabot moves to weekly grouped updates and now also updates GitHub Actions. Workflow permissions are scoped per job, a combined "pnpm check" script replaces the duplicated lint, type and format commands, the CD jobs are renamed to say what they do (prepare-release and build-and-upload), and the contributor docs are updated to match.

## 0.3.3

### Patch Changes

- b5100bd: Added README.md and more developer documentation
- de46666: Add Playwright E2E tests that build the unpacked app and run against it in CI, across the same platforms as Core, with an isolated Electron userData directory and Core 0.21's ELEK_IO_DATA_DIR for test data. Modernize the toolchain to Electron 43 with electron-vite 5 on the Node 24 runtime, TypeScript 6, eslint 10, pnpm 11 supply-chain policies, and refreshed dependencies including lucide-react 1.x and react-day-picker 10. CD now publishes build artifacts to a draft GitHub Release.
- 3b5ff2c: Small visual improvements
- aa6d4f9: Adopt @elek-io/core 0.20.0 and align on a single zod 4.4.3. Core now declares zod as a peer dependency and re-exports z, so the app supplies the shared zod copy. This dedupes zod to one physical version and clears the zodResolver type errors.
- 31b87d5: Render field-definition groups and finish adapting the dynamic form system to @elek-io/core 0.20.0. Groups in a Collection's fieldDefinitions are shown as labeled fieldsets in the Entry form and Collection editor, field definitions are flattened where grouping is irrelevant, and a Project's commit history now comes from a dedicated projects.history query instead of the Project read. Form typing was reworked to infer react-hook-form types from the generated Zod schemas.
- adfcb0e: Shrink the packaged app and broaden Linux packaging. Renderer-only dependencies and @sentry/vite-plugin now live in devDependencies so only true runtime dependencies are bundled, and contributor docs, tests, changesets and dev configs are kept out of the asar. The Linux build drops the snap target, which electron-updater cannot auto-update, and adds rpm and pacman alongside AppImage and deb, so every Linux artifact keeps in-app updates working.
- 24520ae: Updated to latest Core
- 95241d7: Fixed Shadcn init and components
- b741e09: Using new provider for breadcrumbs to allow for static and dynamic page labels in conjuction with Tanstack router and query.
- b741e09: Using Tanstack query as a wrapper around IPC calls for cache handling. Improved perceived performance since we do not wait for data to load before rendering pages and components.

## 0.3.2

### Patch Changes

- 9493e23: Fix CD pipeline

## 0.3.1

### Patch Changes

- 2ff6e9b: Fixed CD pipeline

## 0.3.0

### Minor Changes

- fadeaad: Added local API for developers to be able to recieve Project data locally e.g. for usage in websites during a build step. The local API is based on the OpenAPI specification. Meaning there is a swagger UI available locally when enabled in the users profile. The API can be used to query the data manually or use the [OpenAPI Generator CLI](https://openapi-generator.tech/) like so: `openapi-generator-cli generate -i ./openapi.json -g typescript-fetch -o ./src/api-client --openapi-normalizer SET_TAGS_FOR_ALL_OPERATIONS=elek-io`, where `SET_TAGS_FOR_ALL_OPERATIONS=elek-io` merges the tagged APIs into one for ease of use.
- d488af9: Added basic diff view for changes that happen

## 0.2.0

### Minor Changes

- 3c5d46b: Re-added GUI - instead of using the old UI repository where we created completely custom UI components with headlessui for accessibility, I've switched to shadcn (which uses Radix UI) base components with custom changes. Currently all components exist inside this repository. Once "finished" I'll extract them into the elek-io/ui component library to use them for the website and docs too.

  Also switched from electron-forge to electron-vite and use ESM wherever possible - which is everywhere except the preload.

  There is still some UI isses especially when creating a collection - where the dialog is closing whenever the user inputs something into the modal.
  This can also be seen when the clone Project dialog is used.
  Also buttons sometimes need two clicks to work.

- a9adf5d: Initial setup - pre GUI

  - [x] Debugging main & renderer in VSCode. See https://www.electronforge.io/advanced/debugging
  - [x] CI/CD with lint, test & build
  - [x] Custom file protocol handler to access Assets on disk
  - [x] Working IPC calls
  - [x] Working IPC call to Core with git command execution with included dugite binary
  - [x] Using react inside renderer
  - [x] Typesafe routing working with data loading. See https://tanstack.com/router/latest
  - [x] Sentry.io
    - [x] Error monitoring in renderer, main & preload
    - [x] Replays on error
    - [x] Performance monitoring
    - [x] Profiling
    - [x] Creating releases incl. sourcemap upload
  - [x] First security & best practice audit. See https://github.com/doyensec/electronegativity & https://www.electronjs.org/docs/latest/tutorial/security
  - [x] Automatic updates working. See https://www.electronforge.io/advanced/auto-update (Should work but needs certificates I do not have for not - need to test later)
  - [x] Using an custom app icon
  - [x] Custom borderless window with draggable area
