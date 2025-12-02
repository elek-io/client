# Loading and Updating Data

## Overview

elek.io Client uses [TanStack Query](https://tanstack.com/query/latest) (formerly React Query) for all data fetching and mutations. This provides a consistent, type-safe way to interact with the main process via IPC, with built-in caching, loading states, and error handling.

## Configuration

### Query Client Setup

The base configuration for all queries and mutations is in [`client.ts`](../../src/renderer/queries/client.ts):

**Key Settings:**

- `staleTime: Infinity` (line 9) - Queries remain "fresh" indefinitely and won't automatically refetch. This is appropriate for local data that only changes through user actions.

### Query and Mutation Options

All `queryOptions` and `mutationOptions` are centrally defined in the [`options/`](../../src/renderer/queries/options/) directory with separate files for each domain (`projectOptions.ts`, `collectionOptions.ts`, `entryOptions.ts`, `assetOptions.ts`, `userOptions.ts`, `apiOptions.ts`) and re-exported through [`queries/index.ts`](../../src/renderer/queries/index.ts). These files contain:

- Typed wrappers around IPC calls
- Query keys for cache management
- Automatic cache updates on mutations - Mutations automatically update related queries' cache data. For example, when you create a Project, both the individual Project cache AND the Projects list cache are updated without requiring a refetch.
- Metadata for toast notifications (method and objectType)

## Querying Data

### Using Context Providers for User and Project Data

For accessing the current user and project data, prefer using the `useUser()` and `useProject()` hooks instead of directly calling `useQuery()` with `queryOptions.user.get()` or `queryOptions.projects.read()`.

**Benefits:**

- Reduces the number of active query observers - the providers create a single query that's shared across all components
- Provides convenient utility methods (`formatDatetime`, `translateContent`) that automatically use the current user/project context
- Ensures consistent data access patterns throughout the application
- Better performance with fewer unnecessary query subscriptions

#### UserProvider and useUser Hook

The [`UserProvider`](../../src/renderer/providers/UserProvider.tsx) wraps the entire application at the root level (see [`routes/__root.tsx:130`](../../src/renderer/routes/__root.tsx)). It provides:

- `userQuery: UseQueryResult<User | null>` - The current user query result
- `formatDatetime: (props: FormatDatetimeProps) => { relative: string; absolute: string }` - Formats datetime strings according to the user's locale

**Example:** See [`components/user-header.tsx`](../../src/renderer/components/user-header.tsx)

```typescript
import { useUser } from '@renderer/hooks/useUser';

function UserHeader() {
  const { userQuery, formatDatetime } = useUser();

  // Access user data
  const user = userQuery.data;

  // Format a datetime
  const formattedDate = formatDatetime({ datetime: user?.createdAt });

  return (
    <div>
      <p>{user?.name}</p>
      <p>Joined {formattedDate.relative}</p>
    </div>
  );
}
```

#### ProjectProvider and useProject Hook

The [`ProjectProvider`](../../src/renderer/providers/ProjectProvider.tsx) wraps all project-specific routes (see [`routes/projects/$projectId.tsx:14`](../../src/renderer/routes/projects/$projectId.tsx)). It provides:

- `projectId: string` - The current project ID from the route
- `projectQuery: UseQueryResult<Project>` - The current project query result
- `userQuery: UseQueryResult<User | null>` - The current user query result (inherited from UserProvider)
- `formatDatetime: (props: FormatDatetimeProps) => { relative: string; absolute: string }` - Datetime formatter (inherited from UserProvider)
- `translateContent: (props: TranslateContentProps) => string` - Translates user-defined content to the current user's language, falling back to the project's default language, then English

**Example:** See [`components/project-sidebar.tsx`](../../src/renderer/components/project-sidebar.tsx)

```typescript
import { useProject } from '@renderer/hooks/useProject';

function ProjectSettings() {
  const { projectQuery, translateContent } = useProject();

  // Access project data
  const project = projectQuery.data;

  // Translate content
  const title = translateContent({
    key: 'project.title',
    record: project?.name // TranslatableString object
  });

  return <h1>{title}</h1>;
}
```

### Non-Blocking Page Loads

We prioritize fast, responsive UI by rendering pages immediately without waiting for data to load. Navigation between pages should feel instantaneous.

**Pattern:** Show Skeleton components while data loads, then replace them with actual content when ready.

**Example:** See [`routes/projects/index.tsx`](../../src/renderer/routes/projects/index.tsx)

```typescript
const { data: projects, isPending } = useQuery(
  queryOptions.projects.list({ limit: 0 })
);

return (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
    {isPending
      ? [1, 2, 3, 4, 5].map((i) => <ProjectCardSkeleton key={i} />)
      : projects.list.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
  </div>
);
```

This ensures the page structure renders immediately, with placeholders that are replaced by real data as it loads.

### Error Handling - Prefer useQueryNoError

**Always use [`useQueryNoError`](../../src/renderer/hooks/useQueryNoError.ts) instead of `useQuery` for data fetching.**

This hook solves a TypeScript limitation where `data` is typed as `T | undefined` even with `throwOnError: true`. It manually throws errors to the error boundary and returns a narrowed type without error states.

**Example:** See [`routes/projects/$projectId/collections/$collectionId/index.tsx`](../../src/renderer/routes/projects/$projectId/collections/$collectionId/index.tsx)

```typescript
import { useQueryNoError } from '@renderer/hooks/useQueryNoError';

const { data: collection, isPending } = useQueryNoError(
  queryOptions.collections.read({ projectId, id: collectionId })
);

if (isPending) return <LoadingSkeleton />;

// data is now safely typed as defined (no error or loading states)
return <div>{collection.name}</div>;
```

See the hook's JSDoc for implementation details. Errors are caught by the root `ErrorComponent` in [`routes/__root.tsx`](../../src/renderer/routes/__root.tsx).

**Naming Conventions:**

When destructuring `useQueryNoError`, follow these patterns based on the query operation:

- `data` → Name it as the resulting object (e.g., `project`, `collection`, `entries`)
- `isPending` → Prefix with the query operation (e.g., `isReadingProject`, `isListingProjects`, `isReadingCollection`)

Always look at the `queryOptions` method used to determine the correct names:

```typescript
// queryOptions.projects.read() → reading a single project
const { data: project, isPending: isReadingProject } = useQueryNoError(
  queryOptions.projects.read({ id: projectId })
);

// queryOptions.projects.list() → listing multiple projects
const { data: projects, isPending: isListingProjects } = useQueryNoError(
  queryOptions.projects.list({ limit: 0 })
);

// queryOptions.collections.read() → reading a single collection
const { data: collection, isPending: isReadingCollection } = useQueryNoError(
  queryOptions.collections.read({ projectId, id: collectionId })
);
```

## Mutating Data

### Form Mutations with Existing Data

When building forms to update existing data, we need to handle the loading state gracefully. Forms need to be populated with current values, but those values come from a query that may not be resolved yet.

**Pattern:** Use `<fieldset disabled={isPending}>` to disable the entire form while data loads, instead of showing loading spinners or skeleton forms.

**Example:** See [`routes/user/profile.tsx`](../../src/renderer/routes/user/profile.tsx)

```typescript
const { data: user, isPending: isGettingUser } = useQuery(
  queryOptions.user.get()
);

const setUserForm = useForm<SetUserProps>({
  defaultValues: { /* ... */ }
});

// Update form when data loads
useEffect(() => {
  if (isGettingUser === false) {
    setUserForm.reset(user);
  }
}, [user, setUserForm]);

return (
  <Form {...setUserForm}>
    <form>
      <fieldset disabled={isUserPending}>
        {/* Form fields here - automatically disabled while loading */}
        <FormField name="name" /* ... */ />
        <FormField name="email" /* ... */ />
      </fieldset>
    </form>
  </Form>
);
```

**Benefits:**

- No need for skeleton components in forms
- Form structure renders immediately
- Native browser styling for disabled state
- Prevents user interaction during loading
- Cleaner code with less conditional rendering

### Mutation Metadata

All mutations should include metadata for proper toast notifications and logging. Use the `customMutationOptions` wrapper from [`util.ts`](../../src/renderer/queries/util.ts) to not only make sure the metadata is included, but also to automatically add `throwOnError: true` to propagate errors to the nearest error boundary and log all mutations with Core:

```typescript
customMutationOptions({
  mutationFn: async () => {
    /* ... */
  },
  meta: {
    method: 'create',
    objectType: 'project',
  },
  // ...
});
```

This metadata is used by the query client to automatically display success/error toasts and log all mutations for debugging.

## Cache Management

### Automatic Cache Updates

All mutations in the [`options/`](../../src/renderer/queries/options/) directory include `onSuccess` handlers that automatically update the cache. This ensures the UI reflects changes immediately without requiring refetches.

### The `mergeListWithObject` Helper

Located at [`util.ts:144-195`](../../src/renderer/queries/util.ts), this helper function merges individual objects into paginated list caches:

```typescript
function mergeListWithObject<T extends BaseFile>(
  oldList: PaginatedList<T> | undefined,
  object: T,
  method?: 'update' | 'delete'
): PaginatedList<T>;
```

**Behavior:**

- **No list exists:** Creates new list with the object
- **Object doesn't exist in list:** Adds it to the end
- **Object exists + method='update':** Replaces the object
- **Object exists + method='delete':** Removes the object

**Usage in Mutations:**

```typescript
// Create mutation - add to list
onSuccess: (createdProject, _variables, _result, context) => {
  context.client.setQueryData(
    ['projects', createdProject.id, 'current'],
    createdProject
  );
  context.client.setQueryData<PaginatedList<Project>>(
    ['projects', 'list'],
    (oldList) => mergeListWithObject(oldList, createdProject) // Adds to list
  );
};

// Update mutation - update in list
onSuccess: (updatedProject, _variables, _result, context) => {
  context.client.setQueryData(
    ['projects', updatedProject.id, 'current'],
    updatedProject
  );
  context.client.setQueryData<PaginatedList<Project>>(
    ['projects', 'list'],
    (oldList) => mergeListWithObject(oldList, updatedProject, 'update') // Updates in list
  );
};

// Delete mutation - remove from list
onSuccess: (_deletedProject, variables, _result, context) => {
  context.client.setQueryData(['projects', variables.id, 'current'], undefined);
  context.client.setQueryData<PaginatedList<Project>>(
    ['projects', 'list'],
    (oldList) =>
      mergeListWithObject(oldList, { id: variables.id } as Project, 'delete') // Removes from list
  );
};
```

### Individual Cache Population from Lists

List queries automatically populate individual item caches to avoid redundant fetches:

**Example from project options (see [`options/projectOptions.ts`](../../src/renderer/queries/options/projectOptions.ts)):**

```typescript
list: (props?: ListProjectsProps) =>
  queryOptions({
    queryKey: ['projects', 'list'],
    queryFn: async () => {
      const projects = await window.ipc.core.projects.list(props);

      // Cache each project individually too
      // so we can access them directly without refetching later
      projects.list.forEach((project) => {
        queryClient.setQueryData(['projects', project.id, 'current'], project);
      });

      return projects;
    },
    throwOnError: true,
  });
```

**Benefit:** When navigating to a project detail page after viewing the list, the data is already cached - no loading spinner needed.

### Cache Invalidation Strategies

**Two approaches for cache updates:**

#### 1. Direct Cache Updates (Preferred for CRUD)

Use `setQueryData` with `mergeListWithObject` for operations where you know exactly what changed:

```typescript
onSuccess: (updatedItem, variables, _result, context) => {
  // Update both individual and list caches
  context.client.setQueryData(['items', updatedItem.id], updatedItem);
  context.client.setQueryData(['items', 'list'], (oldList) =>
    mergeListWithObject(oldList, updatedItem, 'update')
  );
};
```

**Pros:** Instant UI updates, no network/IPC calls

**Use for:** create, update, delete, user settings, API start/stop

#### 2. Query Invalidation (For Unknown Scope)

Use `invalidateQueries` for operations that may affect multiple caches:

```typescript
onSuccess: async (_data, variables, _result, context) => {
  await context.client.invalidateQueries({
    queryKey: ['projects', variables.id],
    refetchType: 'all', // Refetch all matching queries
  });
};
```

**Pros:** Safe when scope is unknown, handles cascading updates

**Cons:** Triggers refetches (slower), may refetch unnecessary data

**Use for:** synchronize (git pull), setRemoteOriginUrl

### Anti-Patterns to Avoid

**Do not use `router.invalidate()` after mutations:**

```typescript
// Invalidates all queries for the route
const onSave = async (data) => {
  await saveMutation(data);
  await router.invalidate(); // Too broad, redundant
};
```

**Let mutations handle their own cache updates:**

Mutations already have `onSuccess` handlers that update the necessary caches. Using `router.invalidate()` is redundant and invalidates unrelated queries.

---

**Last Updated:** 2025-12-01
