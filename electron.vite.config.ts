import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * The app version, read from package.json without a cast so strictest stays
 * happy (mirrors the narrowing in src/shared/ipcError.ts).
 */
function readAppVersion(): string {
  const pkg: unknown = JSON.parse(
    readFileSync(resolve(__dirname, 'package.json'), 'utf8')
  );
  if (
    typeof pkg === 'object' &&
    pkg !== null &&
    'version' in pkg &&
    typeof pkg.version === 'string'
  ) {
    return pkg.version;
  }
  throw new Error('package.json is missing a string "version"');
}

// One stable Sentry release name shared by the SDK inits, the Sentry Vite plugin
// and the CD Core source map upload (.github/workflows/cd.yml). Events are
// tagged with it and Core's node source map is uploaded to it, so a CoreError
// frame matches the release artifact and resolves to Core's TypeScript source.
// The CD upload derives the same string from package.json, keep the two in sync.
const sentryRelease = `desktop@${readAppVersion()}`;

export default defineConfig({
  main: {
    // Inject the release name so the main Sentry init can tag events with it
    define: { __APP_RELEASE__: JSON.stringify(sentryRelease) },
    // Dependencies are externalized by default since electron-vite 5 (build.externalizeDeps)
    build: { sourcemap: true },
    plugins: [
      sentryVitePlugin({
        org: 'elek-io',
        project: 'desktop',
        release: { name: sentryRelease },
      }),
    ],
  },
  preload: {
    build: {
      // The sandboxed preload cannot resolve node_modules at runtime,
      // so its dependencies must stay bundled instead of externalized
      externalizeDeps: false,
      rollupOptions: {
        output: {
          // With a sandboxed renderer and preload process the preload cannot use ESM
          // This is still a limitation of using ESM in Electron
          // @see https://www.electronjs.org/docs/latest/tutorial/esm#summary-esm-support-matrix
          // @see https://github.com/alex8088/electron-vite/discussions/423#discussioncomment-8922407
          format: 'cjs',
        },
      },
    },
  },
  renderer: {
    // Inject the release name so the renderer Sentry init can tag events with it
    define: { __APP_RELEASE__: JSON.stringify(sentryRelease) },
    // Emit source maps so @sentry/vite-plugin can upload them and symbolicate
    // renderer (React UI) crashes. They are deleted after upload below, so they
    // do not ship inside the asar.
    build: { sourcemap: true },
    resolve: {
      alias: {
        '@root': resolve(__dirname, '.'),
        '@renderer': resolve(__dirname, './src/renderer'),
      },
    },
    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
        // Absolute paths, since the plugin resolves relative ones against
        // the renderer's Vite root (src/renderer), not the project root
        routesDirectory: resolve(__dirname, './src/renderer/routes'),
        generatedRouteTree: resolve(
          __dirname,
          './src/renderer/routeTree.gen.ts'
        ),
      }),
      viteReact(),
      tailwindcss(),
      sentryVitePlugin({
        org: 'elek-io',
        project: 'desktop',
        release: { name: sentryRelease },
        // Delete the emitted .map files after upload so the multi-MB renderer
        // source maps are not packaged into the shipped app. This runs only on
        // `pnpm build`, not `pnpm dev`, so DevTools debugging is unaffected.
        // Comment out filesToDeleteAfterUpload to keep the maps in a local
        // `pnpm build` when you want to inspect out/.
        sourcemaps: { filesToDeleteAfterUpload: ['./out/renderer/**/*.map'] },
      }),
    ],
  },
});
