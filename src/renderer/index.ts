/**
 * Enables Sentry for error tracking, performance monitoring, and session replay in the Electron renderer process.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/electron/#framework-specific-sdks
 * @see https://docs.sentry.io/platforms/javascript/guides/react/
 * @see https://docs.sentry.io/platforms/javascript/guides/react/tracing/
 * @see https://docs.sentry.io/platforms/javascript/guides/react/features/tanstack-router/
 */
import { decodeCoreErrorForSentry } from '@root/src/shared/sentryCoreError';
import { init } from '@sentry/electron/renderer';
import {
  init as reactInit,
  reactErrorHandler,
  tanstackRouterBrowserTracingIntegration,
  browserProfilingIntegration,
  replayIntegration,
  defaultStackParser,
} from '@sentry/react';
import { createHashHistory, createRouter } from '@tanstack/react-router';

import { routeTree } from '@renderer/routeTree.gen';

// Create a new router instance
const hashHistory = createHashHistory(); // Use hash based routing since in production electron just loads the index.html via the file protocol
const router = createRouter({
  routeTree,
  history: hashHistory,
  context: {},
});
router.subscribe('onBeforeLoad', (event) => {
  void window.ipc.core.logger.info({
    source: 'desktop',
    message: `Desktop navigating from "${event.fromLocation?.href}" to "${event.toLocation.href}"`,
  });
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// E2E tests set NODE_ENV to disable Sentry, so test runs do not report
// errors, traces or replays. A disabled client also never sets up its
// integrations, so profiling and replay stay dormant under test without
// having to gate the integrations array here
const sentryEnabled = window.ipc.electron.process.env['NODE_ENV'] !== 'test';

init(
  {
    dsn: 'https://06f2163a40c4c4f404c41860f46a104b@o4511706089259008.ingest.de.sentry.io/4511706092535888',
    // Injected at build time from the app version (electron.vite.config.ts). Tags
    // events with the release the source maps were uploaded to, so frames resolve.
    release: __APP_RELEASE__,
    enabled: sentryEnabled,
    integrations: [
      tanstackRouterBrowserTracingIntegration(router),
      browserProfilingIntegration(),
      replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    sampleRate: 1.0, // For error events @todo change this to a lower number once more people are using Desktop
    tracesSampleRate: 1.0, // For tracing events @todo change this to a lower number once more people are using Desktop
    profilesSampleRate: 1.0, // For profiling events @todo change this to a lower number once more people are using Desktop
    replaysOnErrorSampleRate: 1.0, // Always send a session replay when an error was thrown
    tracePropagationTargets: ['localhost', /^https:\/\/api\.elek\.io/],
    // Decode any CoreError encoded at the IPC boundary into a readable message
    // and rebuild its stacktrace from Core's forwarded origin stack
    beforeSend: (event) => {
      decodeCoreErrorForSentry(event, defaultStackParser);
      return event;
    },
  },
  reactInit
);

export { reactErrorHandler, router };
