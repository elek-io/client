// Sentry initialization should be imported first!
import '@renderer/sentry';
import '@fontsource-variable/montserrat';
import '@fontsource/roboto';
import { ThemeProvider } from '@renderer/components/theme-provider';
import '@renderer/index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { reactErrorHandler, router } from '@renderer/sentry';

// Initialize TanStack Query
export const queryClient = new QueryClient();

// Render the app
const rootElement = document.getElementById('app')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement, {
    // Callback called when an error is thrown and not caught by an ErrorBoundary.
    onUncaughtError: reactErrorHandler((error, errorInfo) => {
      console.warn('Uncaught error', error, errorInfo.componentStack);
    }),
    // Callback called when React catches an error in an ErrorBoundary.
    onCaughtError: reactErrorHandler(),
    // Callback called when React automatically recovers from errors.
    onRecoverableError: reactErrorHandler(),
  });

  root.render(
    <StrictMode>
      <ThemeProvider defaultTheme="system" storageKey="client-theme">
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>
  );
}
