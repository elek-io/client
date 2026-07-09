# Routing

## Overview

elek.io Desktop uses [TanStack Router](https://tanstack.com/router/latest) with file-based routing. Routes live in [`src/renderer/routes/`](../../src/renderer/routes/) and the route tree is auto-generated into `routeTree.gen.ts` by the TanStack Router plugin (configured in `electron.vite.config.ts`) - never edit that file by hand.

**Key settings:**

- **Hash history** - the router uses `createHashHistory()` because Electron serves the app over the `file://` protocol, which is not compatible with browser history.
- **Auto code-splitting** - enabled on routes, so each route is loaded on demand.

## Layout Routes

Files like [`routes/projects/$projectId.tsx`](../../src/renderer/routes/projects/$projectId.tsx) are layout routes that wrap their children. They provide shared context through providers (for example `ProjectProvider` wraps all project routes), render shared chrome like the sidebar, and render their children with `<Outlet />`.

A layout route is also where ancestor route params are first read and passed into the provider. `ProjectProvider` requires a `projectId`, so the layout reads it with `Route.useParams()` and threads it in:

```tsx
function ProjectLayout(): ReactElement {
  const { projectId } = Route.useParams();

  return (
    <ProjectProvider projectId={projectId}>
      <Outlet />
    </ProjectProvider>
  );
}
```

## Route Parameters

Route parameters are accessed in a type-safe way via `Route.useParams()`:

```typescript
const { projectId, collectionId } = Route.useParams();
```

A nested route exposes all of its ancestors' params, so a route under `$projectId/collections/$collectionId` can read both `projectId` and `collectionId`.

## Data Fetching vs Route Guards

Data is fetched in page components with skeleton loading states, not in `beforeLoad` route guards. See [Loading and Updating Data](./loading-and-updating-data.md) for the fetching patterns.

`beforeLoad` is still used, but only for simple route redirects (for example an index route that redirects to a default child), not for loading data. Fetching in components lets errors bubble to the nearest error boundary instead of blocking route access.
