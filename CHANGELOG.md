# @elek-io/client

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
