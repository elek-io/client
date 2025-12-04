# Overview

## Introduction

elek.io Client is built on [Electron](https://www.electronjs.org/) to create a cross-platform desktop application with web technologies (TypeScript, React).

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

While elek.io Client provides the user interface in a desktop application, all core functionalities related to file I/O, content handling, Git operations, local read-only API hosting and CLI usage are encapsulated in the separate [@elek-io/core](https://github.com/elek-io/core) library.

@elek-io/core is used by the Main Process, since only it has access to the filesystem and Node.js APIs - the Renderer Process is sandboxed for security reasons.

Therefore the Renderer Process communicates with the Main Process via IPC (Inter-Process Communication) to request operations via @elek-io/core.

### IPC Architecture

Type-safe communication between processes:

```typescript
// IPC ContextBridgeApi interface defines the shape of the IPC API (src/index.d.ts)
declare global {
  interface ContextBridgeApi {
    core: {
      projects: {
        create: ElekIoCore['projects']['create'];
      };
    };
  }
}

// Main process registers IPC handlers (src/main/index.ts)
ipcMain.handle('core:projects:create', async (event, props) => {
  return await core.projects.create(props);
});

// Preload exposes the IPC API to the renderer process (src/preload/index.ts)
contextBridge.exposeInMainWorld('ipc', {
  core: {
    projects: {
      create: (...args) => ipcRenderer.invoke('core:projects:create', ...args),
    },
  },
});

// Renderer process uses the IPC API (src/renderer/)
const project = await window.ipc.core.projects.create({
  name: 'My Project',
  description: 'A new Project',
});
```

35+ IPC Channels are available and organized by namespace.

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
├── documentation/         # Developer docs
├── electron-builder.yml   # Build configuration
├── electron.vite.config.ts
├── package.json
└── tsconfig.json
```

### Security

Handling user content that is distributed and could potentially be malicious within an app that has access to the file system, strict security is necessary. elek.io Client follows [Electron's security best practices](https://www.electronjs.org/docs/latest/tutorial/security) to create strong isolation boundaries.

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

Some links to elek.io domains and loading of content are allowed in elek.io Client. To prevent abuse and potential security risks, the following restrictions are in place:

**URL Whitelisting**:

All external requests (e.g., when a user clicks a link inside the renderer or an Asset is displayed) are checked against a whitelist of allowed hostnames:

- `elek-io-local-file://` (custom file protocol)
- `localhost`
- `elek.io`
- `api.elek.io`
- `github.com`

See `allowedHostnamesToLoadExternal` in [`src/main/index.ts:41-46`](/src/main/index.ts) for the implementation.

Links to whitelisted external hostnames are opened in the default system browser, not within an elek.io Client renderer window.

**Custom File Protocol**:

Loading of Assets in the UI is handled via a custom file protocol `elek-io-local-file://` since the standard `file://` protocol in Electron has more privileges than in a browser. This custom protocol implementation ensures path validation (files must be within Project or tmp folders) and prevents directory traversal attacks.

See [`src/main/index.ts:267-305`](/src/main/index.ts) for the custom protocol implementation.

---

**Last Updated:** 2025-12-01
