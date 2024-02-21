import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: './src/renderer/react/routes',
      generatedRouteTree: './src/renderer/react/routeTree.gen.ts',
    }),
  ],
});
