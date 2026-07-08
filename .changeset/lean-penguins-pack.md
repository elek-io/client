---
'@elek-io/client': patch
---

Shrink the packaged app and broaden Linux packaging. Renderer-only dependencies and @sentry/vite-plugin now live in devDependencies so only true runtime dependencies are bundled, and contributor docs, tests, changesets and dev configs are kept out of the asar. The Linux build drops the snap target, which electron-updater cannot auto-update, and adds rpm and pacman alongside AppImage and deb, so every Linux artifact keeps in-app updates working.
