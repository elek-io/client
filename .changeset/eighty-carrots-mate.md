---
'@elek-io/client': minor
---

Re-added GUI - instead of using the old UI repository where we created completely custom UI components with headlessui for accessibility, I've switched to shadcn (which uses Radix UI) base components with custom changes. Currently all components exist inside this repository. Once "finished" I'll extract them into the elek-io/ui component library to use them for the website and docs too.

Also switched from electron-forge to electron-vite and use ESM wherever possible - which is everywhere except the preload.

There is still some UI isses especially when creating a collection - where the dialog is closing whenever the user inputs something into the modal.
This can also be seen when the clone Project dialog is used.
Also buttons sometimes need two clicks to work.
