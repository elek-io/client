import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';
import { resolve } from 'path';

export default defineConfig({
  main: {
    // Dependencies are externalized by default since electron-vite 5 (build.externalizeDeps)
    build: { sourcemap: true },
    plugins: [
      sentryVitePlugin({
        org: 'elek-io',
        project: 'desktop',
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
