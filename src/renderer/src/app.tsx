import '@fontsource-variable/montserrat';
import '@fontsource/roboto';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterProvider,
  createHashHistory,
  createRouter,
} from '@tanstack/react-router';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { ipc } from './ipc';
import { useStore } from './store';

// Import the generated route tree
import { ThemeProvider } from './components/theme-provider';
import { routeTree } from './routeTree.gen';

// Create a new router instance
const hashHistory = createHashHistory(); // Use hash based routing since in production electron just loads the index.html via the file protocol
const router = createRouter({
  routeTree,
  history: hashHistory,
  context: { electron: ipc.electron, core: ipc.core, store: useStore },
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Initialize TanStack Query
const queryClient = new QueryClient();

// Render the app
const rootElement = document.getElementById('app')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>
  );
}
