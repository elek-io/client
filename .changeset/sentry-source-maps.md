---
'@elek-io/desktop': patch
---

Upload source maps to Sentry during CD so production crashes are symbolicated. The build now passes SENTRY_AUTH_TOKEN to @sentry/vite-plugin, and the renderer build emits source maps and runs the plugin alongside the main process, so both processes report readable stack traces instead of minified ones. The renderer maps are deleted after upload so they do not ship inside the app.
