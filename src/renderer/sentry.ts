/**
 * Enables Sentry for error tracking, performance monitoring, and session replay in the Electron renderer process.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/electron/#framework-specific-sdks
 * @see https://docs.sentry.io/platforms/javascript/guides/react/
 * @see https://docs.sentry.io/platforms/javascript/guides/react/tracing/
 * @see https://docs.sentry.io/platforms/javascript/guides/react/features/tanstack-router/
 */
import { init } from '@sentry/electron/renderer';
import {
  init as reactInit,
  reactErrorHandler,
  tanstackRouterBrowserTracingIntegration,
  browserProfilingIntegration,
  replayIntegration,
} from '@sentry/react';
import { createHashHistory, createRouter } from '@tanstack/react-router';

import { ipc } from '@renderer/ipc';
import { routeTree } from '@renderer/routeTree.gen';

// Create a new router instance
const hashHistory = createHashHistory(); // Use hash based routing since in production electron just loads the index.html via the file protocol
const router = createRouter({
  routeTree,
  history: hashHistory,
  context: { electron: ipc.electron, core: ipc.core },
});
router.subscribe('onBeforeLoad', (event) => {
  ipc.core.logger.info(
    `Client navigating from "${event?.fromLocation?.href}" to "${event.toLocation.href}"`
  );
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

init(
  {
    dsn: 'https://c839d5cdaec666911ba459803882d9d0@o4504985675431936.ingest.sentry.io/4506688843546624',
    integrations: [
      tanstackRouterBrowserTracingIntegration(router),
      browserProfilingIntegration(),
      replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    sampleRate: 1.0, // For error events @todo change this to a lower number once more people are using Client
    tracesSampleRate: 1.0, // For tracing events @todo change this to a lower number once more people are using Client
    profilesSampleRate: 1.0, // For profiling events @todo change this to a lower number once more people are using Client
    replaysOnErrorSampleRate: 1.0, // Always send a session replay when an error was thrown
    tracePropagationTargets: ['localhost', /^https:\/\/api\.elek\.io/],
  },
  reactInit
);

export { reactErrorHandler, router };
