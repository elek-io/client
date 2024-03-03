import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import react from '@vitejs/plugin-react';
import Path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite({
      routesDirectory: './src/renderer/react/routes',
      generatedRouteTree: './src/renderer/react/routeTree.gen.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': Path.resolve(__dirname, './src'),
    },
  },
});
