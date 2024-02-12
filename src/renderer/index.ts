/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */
import {
  BrowserProfilingIntegration,
  BrowserTracing,
  Replay,
  init as sentryElectronRendererInit,
} from '@sentry/electron/renderer';
import { init as sentryReactInit } from '@sentry/react';
import './react/app';

sentryElectronRendererInit(
  {
    dsn: 'https://c839d5cdaec666911ba459803882d9d0@o4504985675431936.ingest.sentry.io/4506688843546624',
    integrations: [
      new BrowserTracing(),
      new BrowserProfilingIntegration(),
      new Replay({
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
  sentryReactInit
);
console.log(
  '👋 This message is being logged by "renderer.ts", included via Vite'
);
