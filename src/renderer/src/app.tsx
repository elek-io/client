import '@fontsource-variable/montserrat';
import '@fontsource/roboto';
import { ThemeProvider } from '@renderer/components/theme-provider';
import '@renderer/index.css';
import { ipc } from '@renderer/ipc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  RouterProvider,
  createHashHistory,
  createRouter,
} from '@tanstack/react-router';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

// Import the generated route tree
import { routeTree } from '@renderer/routeTree.gen';

// Initialize TanStack Query
const queryClient = new QueryClient();

// Create a new router instance
const hashHistory = createHashHistory(); // Use hash based routing since in production electron just loads the index.html via the file protocol
const router = createRouter({
  routeTree,
  history: hashHistory,
  context: { queryClient },
});
router.subscribe('onBeforeLoad', (event) => {
  ipc.core.logger.info(
    `Client navigating from "${event.fromLocation.href}" to "${event.toLocation.href}"`
  );
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById('app')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>
  );
}
