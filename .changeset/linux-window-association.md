---
"@elek-io/desktop": patch
---

Fix Linux window association. Set desktopName in package.json and linux.syncDesktopName in electron-builder.yml so the installed .desktop filename, its StartupWMClass and the app_id Electron reports at runtime all agree on io.elek.desktop. A running window now shows the app's own icon and groups with its launcher in the dock instead of falling back to a generic icon, and the electron-builder window-association warning is gone.
