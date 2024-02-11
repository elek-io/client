import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    // Some libs that can run in both Web and Node.js, such as `axios`, we need to tell Vite to build them in Node.js.
    browserField: false,
    mainFields: ['module', 'jsnext:main', 'jsnext'],
    conditions: ['node'], // To get the resolution behavior of Node.js. Otherwise we get "getRandomValues() not supported" while creating UUIDs @see https://github.com/uuidjs/uuid/issues/544#issuecomment-740394448
  },

  build: {
    sourcemap: true, // Needed to debug
  },

  plugins: [
    sentryVitePlugin({
      org: 'elek-io',
      project: 'client',
    }),
  ],
});
