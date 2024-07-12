import * as Sentry from '@sentry/electron/renderer';
import { init as sentryReactInit } from '@sentry/react';
import './app';

Sentry.init(
  {
    dsn: 'https://c839d5cdaec666911ba459803882d9d0@o4504985675431936.ingest.sentry.io/4506688843546624',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.browserProfilingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      })
    ],
    sampleRate: 1.0, // For error events @todo change this to a lower number once more people are using Client
    tracesSampleRate: 1.0, // For tracing events @todo change this to a lower number once more people are using Client
    profilesSampleRate: 1.0, // For profiling events @todo change this to a lower number once more people are using Client
    replaysOnErrorSampleRate: 1.0, // Always send a session replay when an error was thrown
    tracePropagationTargets: ['localhost', /^https:\/\/api\.elek\.io/],
  },
  sentryReactInit
);
console.log(
  '👋 This message is being logged by "renderer/src/main.tsx", included via Vite'
);
