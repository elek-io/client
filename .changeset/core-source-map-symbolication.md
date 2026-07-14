---
'@elek-io/desktop': patch
---

Symbolicate CoreError stack traces in Sentry down to @elek-io/core's TypeScript source. Core is externalized and loaded from node_modules, so the Sentry Vite plugin never uploaded its source map. CD now uploads Core's self-contained node map to a per-version Sentry release (desktop@<version>) with sentry-cli, both SDK inits tag events with that release, and the renderer beforeSend normalizes the rebuilt CoreError frames to a stable artifact path so Sentry matches the release artifact. A forwarded CoreError frame now resolves to Core's .ts instead of the shipped index.node.mjs. Core needs no change, and the map is uploaded from node_modules at build time so it does not ship in the app.
