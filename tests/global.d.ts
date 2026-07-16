// Inside `page.evaluate` the callback runs in the renderer, where `window` and
// the `window.ipc` bridge exist. Specs type-check under the Node tsconfig,
// which has no DOM lib, so `window` is declared here. Its `ipc` shape comes
// from the global Window augmentation in src/index.d.ts.
declare const window: Window;
