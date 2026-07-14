# Overview

## Introduction

elek.io Desktop is built on [Electron](https://www.electronjs.org/) to create a cross-platform desktop application with web technologies (TypeScript, React).

> [!NOTE]
> By choosing Electron, we keep the languages (everything is mainly TypeScript) used throughout our repositories to a minimum and the knowledge barrier for potential contributors low. Although applications build e.g. with [Tauri](https://tauri.app/) do have a smaller bundle size and memory footprint, adding another language (Rust) would increase complexity for contributors by alot.

## Architecture

Electron applications consist of three main layers: the Main Process, the Preload Script, and the Renderer Process.

```
┌─────────────────────────────────────────────────────────┐
│                    Main Process                         │
│  - Application lifecycle and window management          │
│  - IPC handlers with @elek-io/core integration          │
│  - Security enforcement                                 │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────┴───────────────────┐
        │                             │
┌───────▼───────────┐   ┌─────────────▼───────────┐
│   Preload Script  │   │    Renderer Process     │
│                   │   │                         │
│ - Context Bridge  │   │ - React UI (shadcn/ui)  │
│ - Type-safe       │   │ - TanStack Router       │
│   IPC API         │   └─────────────────────────┘
└───────────────────┘

```

While elek.io Desktop provides the user interface in a desktop application, all core functionalities related to file I/O, content handling, Git operations, local read-only API hosting and CLI usage are encapsulated in the separate [@elek-io/core](https://github.com/elek-io/core) library.

@elek-io/core is used by the Main Process, since only it has access to the filesystem and Node.js APIs - the Renderer Process is sandboxed for security reasons.

Therefore the Renderer Process communicates with the Main Process via IPC (Inter-Process Communication) to request operations via @elek-io/core.

### Application Lifecycle

The Main process is a single `Main` class (instantiated at the bottom of [`src/main/index.ts`](/src/main/index.ts)). Its constructor wires Electron app events, and the real work happens once Electron is ready.

On `app.on('ready')` the `onAppReady()` method:

1. Creates the `ElekIoCore` instance (log level `info` when packaged, `debug` otherwise).
2. Reads the persisted user and, if `user.localApi.isEnabled` is true, **starts the local read-only API automatically** on `user.localApi.port`. The API can therefore already be serving before the renderer ever calls `core:api:start`.
3. Registers the custom file protocol.
4. Creates the first window (`createWindow()`), registers the IPC handlers for it (`registerIpcMain()`), then loads the renderer into it (`loadWindow()`).

The order in step 4 matters: the renderer issues IPC calls as soon as it mounts, so the handlers are registered **before** the renderer is loaded. Registering after the load would leave a startup gap where an early call arrives before its handler exists and rejects with "No handler registered", which `throwOnError` turns into the root error boundary on launch. The handlers only touch the window when invoked, so it just needs to exist (be created) at registration time, not be loaded. This is why `createWindow()` only creates the window and `loadWindow()` loads it, kept as two steps.

Other lifecycle events: `activate` (macOS dock click) recreates and loads a window if none are open, and `window-all-closed` quits the app on Windows and Linux but not on macOS.

**Window management** (`createWindow()` / `loadWindow()`):

- The window is **frameless**: `frame: false`, `titleBarStyle: 'hidden'`, `titleBarOverlay: true`. The title bar is drawn in the renderer, so the native frame is intentionally removed.
- On Linux the app icon is set explicitly from `resources/icon.png`.
- The initial size is computed in `getInitialWindowSize()` as 80% of the primary display's work area, constrained to a 16:9 ratio.

### IPC Architecture

Type-safe communication between processes:

```typescript
// IPC ContextBridgeApi interface defines the shape of the IPC API (src/index.d.ts)
// AsyncifyMethods wraps every Core method's return value in a Promise (see below)
declare global {
  interface ContextBridgeApi {
    core: AsyncifyMethods<{
      projects: {
        create: ElekIoCore['projects']['create'];
      };
    }>;
  }
}

// Main process registers every handler from a single channel-to-handler map (src/main/index.ts)
const channelToHandlerMap = {
  'core:projects:create': core.projects.create.bind(core.projects),
  // ... one entry per channel
} as const;
(Object.keys(channelToHandlerMap) as Channel[]).forEach((channel) => {
  ipcMain.handle(channel, async (_event, ...args) =>
    channelToHandlerMap[channel](...args)
  );
});

// Preload exposes the typed IPC API to the renderer process (src/preload/index.ts)
const ipc: ContextBridgeApi = {
  core: {
    projects: {
      create: async (...args) =>
        ipcRenderer.invoke('core:projects:create', ...args),
    },
  },
};
contextBridge.exposeInMainWorld('ipc', ipc);

// Renderer process uses the IPC API (src/renderer/)
const project = await window.ipc.core.projects.create({
  name: 'My Project',
  description: 'A new Project',
});
```

The 37 channels are organized by namespace: `core:projects:*`, `core:collections:*`, `core:entries:*`, `core:assets:*`, `core:user:*`, `core:api:*`, `core:logger:*` and `electron:dialog:*`.

All Core methods are asynchronous in the renderer even when they are synchronous in Core, since every call crosses the IPC boundary. The `AsyncifyMethods` utility type in [`src/index.d.ts`](/src/index.d.ts) reflects this by wrapping every Core method's return value in a `Promise`.

**Adding a new IPC channel:**

1. Add an entry to the `channelToHandlerMap` inside `registerIpcMain` in [`src/main/index.ts`](/src/main/index.ts) that maps the channel name to the bound Core method, for example `'core:projects:create': core.projects.create.bind(core.projects)`. A single loop registers `ipcMain.handle` for every entry, so do not add a standalone `ipcMain.handle` call.
2. Expose it in [`src/preload/index.ts`](/src/preload/index.ts) via `ipcRenderer.invoke`
3. Add its type to the `ContextBridgeApi` interface in [`src/index.d.ts`](/src/index.d.ts)
4. Add a matching `queryOptions` / `mutationOptions` entry under [`src/renderer/queries/options/`](/src/renderer/queries/options/)

> [!NOTE]
> The two `electron:dialog:*` channels are special-cased in the registration loop: the main `BrowserWindow` is injected as the first argument before the bound handler is called. Every `core:*` channel is called with the renderer's arguments unchanged.

**Error serialization at the handler loop:** the same single `ipcMain.handle` wrapper also try/catches the handler call. A structured clone across the IPC boundary drops the `CoreError` subclass and its custom `type`/`statusCode` fields, reducing the error to the plain `Error` shape (message and stack). To preserve the reason a Core operation failed with, the wrapper catches a thrown `CoreError` and re-throws `new Error(serializeCoreError(error.type, error.message))`, which packs the `type` into the message behind a sentinel. Everything that is not a `CoreError` propagates unchanged. The renderer decodes it with `parseIpcError` from the shared module [`src/shared/ipcError.ts`](/src/shared/ipcError.ts), which is bundled into both processes. The full story, including how the renderer maps the decoded `type` to reason-specific copy and how it is decoded for Sentry too, is in [Error Handling](./error-handling.md).

### Project Structure

```
client/
├── src/
│   ├── main/              # Electron main process
│   │   └── index.ts       # App initialization, IPC, security
│   ├── preload/           # Electron preload scripts
│   │   └── index.ts       # Context bridge API
│   └── renderer/          # React frontend
│       ├── components/
│       │   ├── forms/     # Dynamic form components
│       │   └── ui/        # UI components
│       ├── hooks/         # React hooks
│       ├── lib/           # Utilities
│       ├── providers/     # Context providers (UserProvider, ProjectProvider)
│       ├── queries/       # Data fetching, mutations and caching
│       │   └── options/   # Query/mutation options organized by domain
│       ├── routes/        # File-based routing
│       │   ├── projects/
│       │   │   ├── $projectId/
│       │   │   │   ├── assets/
│       │   │   │   ├── collections/
│       │   │   │   │   └── $collectionId/
│       │   │   │   │       └── $entryId/
│       │   │   │   ├── dashboard.tsx
│       │   │   │   ├── history/
│       │   │   │   └── settings/
│       │   │   └── create.tsx
│       │   ├── user/
│       │   │   └── profile.tsx
│       │   └── __root.tsx
│       ├── app.tsx        # App entry point
│       └── index.ts       # Error monitoring and router setup
├── build/                 # Build resources (icons, etc.)
├── contributing/          # Contributor docs
├── electron-builder.yml   # Build configuration
├── electron.vite.config.ts
├── package.json
└── tsconfig.json
```

### Provider Composition

React context providers are mounted at two levels:

- **Outside the router**, in [`app.tsx`](/src/renderer/app.tsx): `ThemeProvider` > `QueryClientProvider` > `RouterProvider`. These do not need router hooks.
- **Inside the router**: `UserProvider` > `BreadcrumbProvider` wrap the whole app in [`routes/__root.tsx`](/src/renderer/routes/__root.tsx), and `ProjectProvider` wraps each project route in [`routes/projects/$projectId.tsx`](/src/renderer/routes/projects/$projectId.tsx).

When adding a new global provider, decide which level it belongs to. Anything that needs router hooks (`useMatches`, `useRouter`) must live inside `RouterProvider`, so in `__root.tsx`. Otherwise it can sit above the router in `app.tsx` like `ThemeProvider`.

### Security

Handling user content that is distributed and could potentially be malicious within an app that has access to the file system, strict security is necessary. elek.io Desktop follows [Electron's security best practices](https://www.electronjs.org/docs/latest/tutorial/security) to create strong isolation boundaries.

The Renderer Process can only communicate with the Main Process via a controlled IPC API exposed through the Preload Script. This ensures that untrusted code running in the Renderer Process (e.g., third-party libraries or user content) cannot directly access Node.js APIs or the filesystem.

#### Renderer Process Isolation

See [`src/main/index.ts`](/src/main/index.ts) for the following settings:

```typescript
{
  nodeIntegration: false,        // No Node.js APIs in renderer
  contextIsolation: true,        // Separate contexts
  sandbox: true,                 // Sandboxed environment
}
```

#### CSP meta tag

A Content Security Policy is enforced via a `<meta>` tag in the `src/renderer/index.html` file to prevent XSS attacks.

#### External Content Restrictions

Some links to elek.io domains and loading of content are allowed in elek.io Desktop. To prevent abuse and potential security risks, the following restrictions are in place:

**URL Whitelisting**:

All external requests (e.g., when a user clicks a link inside the renderer or an Asset is displayed) are checked against a whitelist of allowed hostnames:

- `elek-io-local-file://` (custom file protocol)
- `localhost`
- `elek.io`
- `api.elek.io`
- `github.com`

See `allowedHostnamesToLoadExternal` in [`src/main/index.ts:41-47`](/src/main/index.ts) for the implementation.

Links to whitelisted external hostnames are opened in the default system browser, not within an elek.io Desktop renderer window.

A separate whitelist, `allowedHostnamesToLoadInternal`, controls in-window navigation: a `will-navigate` handler blocks any navigation whose origin is not on it. This list is empty in production and only holds the Vite dev server URL in development, so navigating the renderer window away from the app is effectively disabled in production. Note the external list is matched against the URL's `hostname`, while the internal list is matched against its `origin`.

**Custom File Protocol**:

Loading of Assets in the UI is handled via a custom file protocol `elek-io-local-file://` since the standard `file://` protocol in Electron has more privileges than in a browser. This custom protocol implementation ensures path validation (files must be within Project or tmp folders) and prevents directory traversal attacks.

See [`src/main/index.ts:272-305`](/src/main/index.ts) for the custom protocol implementation.

### Path Aliases

Configured in `tsconfig.json` and `electron.vite.config.ts`:

- `@root/*` → `./*`
- `@renderer/*` → `./src/renderer/*`

```typescript
import { useProject } from '@renderer/hooks/useProject';
import { queryOptions } from '@renderer/queries';
```

### TypeScript Setup

The two processes are type-checked under separate configs, because they run in different environments (Node for main and preload, the browser-like renderer for the UI).

- [`tsconfig.json`](/tsconfig.json) is a solution file with no sources of its own. It only references the two project configs.
- [`tsconfig.node.json`](/tsconfig.node.json) covers `src/main`, `src/preload`, `electron.vite.config.ts` and the IPC types in `src/index.d.ts`. It extends `@tsconfig/node22` plus `@tsconfig/strictest`.
- [`tsconfig.web.json`](/tsconfig.web.json) covers `src/renderer` and `src/index.d.ts`. It extends `@tsconfig/vite-react` plus `@tsconfig/strictest`, with `jsx: react-jsx`.

Both projects are `composite`, so the `check-types:node` / `check-types:web` scripts pass `--composite false` (a composite project cannot be type-checked directly with `--noEmit`). `pnpm check-types` runs both. Because both extend `@tsconfig/strictest`, expect strict null checks and `noUncheckedIndexedAccess`. A type error may appear in only one process, so check which config owns the file when something type-checks locally but not in the other process.

### Build Configuration

The app is built with [electron-vite](https://electron-vite.org/), which uses three separate configs in `electron.vite.config.ts`:

- **Main process** - ESM output, source maps enabled, Sentry plugin for error tracking
- **Preload script** - CommonJS output (required by Electron's sandbox) with no external dependencies
- **Renderer process** - the TanStack Router plugin (auto-generates `routeTree.gen.ts`), the Vite React plugin, Tailwind CSS via `@tailwindcss/vite`, and automatic code-splitting on routes

For how these three builds decide what ships in the packaged app, the resulting rule for `dependencies` vs `devDependencies`, and what drives app size, see [Build and Packaging](./build-and-packaging.md).

### Known Considerations

- DevTools are opened automatically in development via `window.webContents.openDevTools()` in [`src/main/index.ts:242`](/src/main/index.ts) (the development branch of `loadWindow`). The packaged branch keeps a commented-out call to uncomment when debugging a production build.
- Sentry is initialized in two separate places, the main process ([`src/main/index.ts`](/src/main/index.ts)) and the renderer ([`src/renderer/index.ts`](/src/renderer/index.ts)), both at 100% sampling. The renderer also enables session replay. Lowering sampling or disabling telemetry means editing both init sites. Both inits share a `beforeSend` hook (`decodeCoreErrorForSentry` from [`src/shared/sentryCoreError.ts`](/src/shared/sentryCoreError.ts)) that rewrites a CoreError serialized at the IPC boundary back into a readable message and adds a `core_error_type` tag, so a captured CoreError does not show up as the raw sentinel payload. It is the same decode the renderer applies for display (see the [IPC error serialization](#ipc-architecture) note), reused so Sentry and the UI agree. For the full logging picture, local and Sentry, see [Error Handling](./error-handling.md).
- Auto-update is currently disabled. The `update-electron-app` call in the `Main` constructor is commented out, and the `electron-updater` dependency is not imported anywhere, so there is no active auto-update path.
- All Core methods are async in the renderer even when synchronous in Core (the IPC boundary requires it)
- The preload script must be CommonJS due to Electron's sandboxing limitations
- Hash routing is required for compatibility with Electron's `file://` protocol
