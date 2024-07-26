import { sentryVitePlugin } from '@sentry/vite-plugin';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import { resolve } from 'path';

export default defineConfig({
  main: {
    build: { sourcemap: true },
    plugins: [
      externalizeDepsPlugin(),
      sentryVitePlugin({
        org: 'elek-io',
        project: 'client',
      }),
    ],
  },
  preload: {
    build: {
      rollupOptions: {
        output: {
          // With a sandboxed renderer and preload process the preload cannot use ESM
          // This is a current (v31.2) limitation of using ESM in Electron
          // @see https://www.electronjs.org/docs/latest/tutorial/esm#summary-esm-support-matrix
          // @see https://github.com/alex8088/electron-vite/discussions/423#discussioncomment-8922407
          format: 'cjs',
        },
      },
    },
    // plugins: [externalizeDepsPlugin()], @see above
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
      },
    },
    plugins: [
      TanStackRouterVite({
        routesDirectory: './src/renderer/src/routes',
        generatedRouteTree: './src/renderer/src/routeTree.gen.ts',
      }),
      viteReact(),
    ],
  },
});
