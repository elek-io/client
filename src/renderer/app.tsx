import '@fontsource-variable/montserrat';
import '@fontsource/roboto';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import { ThemeProvider } from '@renderer/components/theme-provider';
import '@renderer/index';
// eslint-disable-next-line no-duplicate-imports
import { reactErrorHandler, router } from '@renderer/index';
import '@renderer/index.css';
import { queryClient } from '@renderer/queries';

// Render the app
const rootElement = document.getElementById('app')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement, {
    // Callback called when an error is thrown and not caught by an ErrorBoundary.
    // Type cast needed: React 19 ErrorInfo type includes `| undefined` for optional properties,
    // but @sentry/react v10.17.0 ErrorInfo type doesn't. Runtime behavior is compatible.
    onUncaughtError: reactErrorHandler((error, errorInfo) => {
      void window.ipc.core.logger.error({
        source: 'desktop',
        message: `Uncaught React error`,
        meta: { error, errorInfo },
      });
    }) as (
      error: unknown,
      errorInfo: { componentStack?: string | undefined }
    ) => void,
    // Callback called when React catches an error in an ErrorBoundary.
    onCaughtError: reactErrorHandler() as (
      error: unknown,
      errorInfo: {
        componentStack?: string | undefined;
        errorBoundary?: React.Component<unknown> | undefined;
      }
    ) => void,
    // Callback called when React automatically recovers from errors.
    onRecoverableError: reactErrorHandler() as (
      error: unknown,
      errorInfo: ReactDOM.ErrorInfo
    ) => void,
  });

  root.render(
    <StrictMode>
      <ThemeProvider defaultTheme="system">
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>
  );
}
