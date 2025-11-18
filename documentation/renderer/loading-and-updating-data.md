# Loading and Updating Data

## Overview

elek.io Client uses [TanStack Query](https://tanstack.com/query/latest) (formerly React Query) for all data fetching and mutations. This provides a consistent, type-safe way to interact with the main process via IPC, with built-in caching, loading states, and error handling.

## Configuration

### Query Client Setup

The base configuration for all queries and mutations is in [`client.ts`](../../src/renderer/queries/client.ts):

**Key Settings:**

- `staleTime: Infinity` (line 25) - Queries remain "fresh" indefinitely and won't automatically refetch. This is appropriate for local data that only changes through user actions.
- Automatic toast notifications for all mutations (success and failure)
- Error and success logging to Core logger

### Query and Mutation Options

All `queryOptions` and `mutationOptions` are centrally defined in [`options.ts`](../../src/renderer/queries/options.ts). This file contains:

- Typed wrappers around IPC calls
- Query keys for cache management
- Automatic cache updates on mutations - Mutations automatically update related queries' cache data. For example, when you create a Project, both the individual Project cache AND the Projects list cache are updated without requiring a refetch.
- Metadata for toast notifications (method and objectType)

## Querying Data

### Non-Blocking Page Loads

We prioritize fast, responsive UI by rendering pages immediately without waiting for data to load. Navigation between pages should feel instantaneous.

**Pattern:** Show Skeleton components while data loads, then replace them with actual content when ready.

**Example:** See [`routes/projects/index.tsx:115-120`](../../src/renderer/routes/projects/index.tsx)

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

## Mutating Data

### Form Mutations with Existing Data

When building forms to update existing data, we need to handle the loading state gracefully. Forms need to be populated with current values, but those values come from a query that may not be resolved yet.

**Pattern:** Use `<fieldset disabled={isPending}>` to disable the entire form while data loads, instead of showing loading spinners or skeleton forms.

**Example:** See [`routes/user/profile.tsx:178`](../../src/renderer/routes/user/profile.tsx)

```typescript
const { data: user, isPending: isUserPending } = useQuery(
  queryOptions.user.get()
);

const setUserForm = useForm<SetUserProps>({
  defaultValues: { /* ... */ }
});

// Update form when data loads
useEffect(() => {
  if (user) {
    setUserForm.reset({
      name: user.name,
      email: user.email,
      // ... other fields
    });
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

All mutations should include metadata for proper toast notifications and logging:

```typescript
mutationOptions({
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

---

**Last Updated:** 2025-11-18
