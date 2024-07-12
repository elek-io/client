import { sentryVitePlugin } from '@sentry/vite-plugin';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import { resolve } from 'path';

export default defineConfig({
  main: {
    build: {sourcemap: true},
    plugins: [externalizeDepsPlugin(), sentryVitePlugin({
      org: 'elek-io',
      project: 'client',
    }),]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(), TanStackRouterVite({
      routesDirectory: './src/renderer/src/routes',
      generatedRouteTree: './src/renderer/src/routeTree.gen.ts',
    }),]
  }
})
