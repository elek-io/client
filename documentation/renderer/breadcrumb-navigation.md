# Breadcrumb Navigation

## Overview

The breadcrumb system provides automatic breadcrumb navigation based on TanStack Router's route hierarchy. It displays the navigation path in the application header, allowing users to understand their current location and navigate back through the hierarchy.

**Key Features:**

- **Route-based:** Automatically tracks route matches from TanStack Router
- **Dynamic labels:** Supports both static strings and dynamic content (e.g., project names, entry titles)

## Architecture

The breadcrumb system consists of three main parts:

### BreadcrumbProvider (`src/renderer/providers/BreadcrumbProvider.tsx`)

The provider manages breadcrumb state using a Map and TanStack Router's `useMatches()` hook.
It's `setBreadcrumb()` method adds a new breadcrumb to the map, using path as the key.

When computing the current breadcrumbs, it iterates over the active route matches provided by `useMatches()`. Each match contains (along with other properties) the `routeId` and `pathname`.
E.g. if you are currently at `/projects/32ba1a3c-c775-4ff0-b5cd-08c71edfe18b/dashboard`, the matches would be:

```typescript
[
  { routeId: '__root__', pathname: '/' },
  { routeId: '/projects', pathname: '/projects' },
  {
    routeId: '/projects/$projectId',
    pathname: '/projects/32ba1a3c-c775-4ff0-b5cd-08c71edfe18b',
  },
  {
    routeId: '/projects/$projectId/dashboard',
    pathname: '/projects/32ba1a3c-c775-4ff0-b5cd-08c71edfe18b/dashboard',
  },
];
```

For each match, it looks up the corresponding breadcrumb in its internal map by `pathname` to build the breadcrumb trail, returning an ordered array of breadcrumbs.

**Provider Location:** Wraps the entire application in `src/renderer/routes/__root.tsx:18`

```tsx
<BreadcrumbProvider>
  <UserProvider>{/* App content */}</UserProvider>
</BreadcrumbProvider>
```

### useBreadcrumb Hook (`src/renderer/hooks/useBreadcrumb.ts`)

A hook that registers breadcrumbs for specific routes.

```typescript
export interface BreadcrumbContextValue {
  breadcrumbs: Breadcrumb[];
  setBreadcrumb: (path: string, label: string) => void;
  clearBreadcrumb: (path: string) => void;
}

function useBreadcrumb(
  route?: AnyRoute,
  label?: string | undefined
): BreadcrumbContextValue;
```

The hook takes an optional `route` (returned value of `createFileRoute()`) and `label`. If provided, it uses the providers `setBreadcrumb()` method to register the current path of `route.pathname` with the given `label`.

## Usage Patterns

### Static Breadcrumb Label

For routes with fixed labels (e.g., "Settings", "Dashboard"):

```tsx
// src/renderer/routes/projects/$projectId/settings.tsx
import { useBreadcrumb } from '@renderer/hooks/useBreadcrumb';

export const Route = createFileRoute('/projects/$projectId/settings')({
  component: ProjectSettingsLayout,
});

function ProjectSettingsLayout(): ReactElement {
  useBreadcrumb(Route, 'Settings');

  return <Outlet />;
}
```

**Result:** Displays "Settings" in the breadcrumb trail

### Dynamic Breadcrumb Label

For routes with data-dependent labels (e.g., project name, entry title):

```tsx
// src/renderer/routes/projects/$projectId.tsx
import { useBreadcrumb } from '@renderer/hooks/useBreadcrumb';
import { useProject } from '@renderer/hooks/useProject';

function ProjectLayoutContent(): React.JSX.Element {
  const {
    projectQuery: { data: project, isPending: isReadingProject },
  } = useProject();

  // Pass undefined while loading
  useBreadcrumb(Route, isReadingProject === false ? project.name : undefined);

  return <Outlet />;
}
```

**Result:** Displays the project name in the breadcrumb trail

### Accessing Breadcrumb Context

To access current breadcrumbs without registering a new one:

```tsx
// src/renderer/components/user-header.tsx
import { useBreadcrumb } from '@renderer/hooks/useBreadcrumb';

export function UserHeader(): React.JSX.Element {
  const { breadcrumbs } = useBreadcrumb();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index, array) => (
          <Fragment key={crumb.path}>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={crumb.path}>{crumb.label}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {array.length !== index + 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

---

**Last Updated:** 2025-12-04
