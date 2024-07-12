import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const ipc = {
  electron: electronAPI,
  core: {
    user: {
      get: (...args) => ipcRenderer.invoke('core:user:get', args),
      set: (...args) => ipcRenderer.invoke('core:user:set', args),
    },
    projects: {
      count: (...args) => ipcRenderer.invoke('core:projects:count', args),
      create: (...args) => ipcRenderer.invoke('core:projects:create', args),
      list: (...args) => ipcRenderer.invoke('core:projects:list', args),
      read: (...args) => ipcRenderer.invoke('core:projects:read', args),
      update: (...args) => ipcRenderer.invoke('core:projects:update', args),
      delete: (...args) => ipcRenderer.invoke('core:projects:delete', args),
    },
    assets: {
      list: (...args) => ipcRenderer.invoke('core:assets:list', args),
      create: (...args) => ipcRenderer.invoke('core:assets:create', args),
      delete: (...args) => ipcRenderer.invoke('core:assets:delete', args),
    },
    // snapshots: {
    //   commitHistory: (...args) =>
    //     ipcRenderer.invoke('core:snapshots:commitHistory', args),
    //   list: (...args) => ipcRenderer.invoke('core:snapshots:list', args),
    // },
    collections: {
      list: (...args) => ipcRenderer.invoke('core:collections:list', args),
      create: (...args) => ipcRenderer.invoke('core:collections:create', args),
      read: (...args) => ipcRenderer.invoke('core:collections:read', args),
      update: (...args) => ipcRenderer.invoke('core:collections:update', args),
      delete: (...args) => ipcRenderer.invoke('core:collections:delete', args),
    },
    entries: {
      list: (...args) => ipcRenderer.invoke('core:entries:list', args),
      create: (...args) => ipcRenderer.invoke('core:entries:create', args),
      read: (...args) => ipcRenderer.invoke('core:entries:read', args),
      update: (...args) => ipcRenderer.invoke('core:entries:update', args),
      delete: (...args) => ipcRenderer.invoke('core:entries:delete', args),
    },
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('ipc', ipc)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.ipc = ipc
}


// // See the Electron documentation for details on how to use preload scripts:
// // https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
// import type Core from '@elek-io/core';
// import * as Sentry from '@sentry/electron/renderer';
// import { contextBridge, ipcRenderer, type Dialog } from 'electron';

// Sentry.init({
//   dsn: 'https://c839d5cdaec666911ba459803882d9d0@o4504985675431936.ingest.sentry.io/4506688843546624',
// });
// export interface ContextBridgeApi {
//   electron: {
//     dialog: {
//       showOpenDialog: Dialog['showOpenDialog'];
//     };
//   };
//   core: {
//     user: {
//       get: Core['user']['get'];
//       set: Core['user']['set'];
//     };
//     projects: {
//       create: Core['projects']['create'];
//       count: Core['projects']['count'];
//       list: Core['projects']['list'];
//       read: Core['projects']['read'];
//       update: Core['projects']['update'];
//       delete: Core['projects']['delete'];
//     };
//     assets: {
//       list: Core['assets']['list'];
//       create: Core['assets']['create'];
//       delete: Core['assets']['delete'];
//     };
//     collections: {
//       list: Core['collections']['list'];
//       create: Core['collections']['create'];
//       read: Core['collections']['read'];
//       update: Core['collections']['update'];
//       delete: Core['collections']['delete'];
//     };
//     entries: {
//       list: Core['entries']['list'];
//       create: Core['entries']['create'];
//       read: Core['entries']['read'];
//       update: Core['entries']['update'];
//       delete: Core['entries']['delete'];
//     };
//     // sharedValues: {
//     //   list: Core['sharedValues']['list'];
//     //   create: Core['sharedValues']['create'];
//     //   read: Core['sharedValues']['read'];
//     //   update: Core['sharedValues']['update'];
//     //   delete: Core['sharedValues']['delete'];
//     // };
//   };
// }

// const exposedApi: ContextBridgeApi = {
//   electron: {
//     dialog: {
//       showOpenDialog: (options: Electron.OpenDialogOptions) =>
//         ipcRenderer.invoke('electron:dialog:showOpenDialog', options),
//     },
//   },
//   core: {
    // user: {
    //   get: (...args) => ipcRenderer.invoke('core:user:get', args),
    //   set: (...args) => ipcRenderer.invoke('core:user:set', args),
    // },
    // projects: {
    //   count: (...args) => ipcRenderer.invoke('core:projects:count', args),
    //   create: (...args) => ipcRenderer.invoke('core:projects:create', args),
    //   list: (...args) => ipcRenderer.invoke('core:projects:list', args),
    //   read: (...args) => ipcRenderer.invoke('core:projects:read', args),
    //   update: (...args) => ipcRenderer.invoke('core:projects:update', args),
    //   delete: (...args) => ipcRenderer.invoke('core:projects:delete', args),
    // },
    // assets: {
    //   list: (...args) => ipcRenderer.invoke('core:assets:list', args),
    //   create: (...args) => ipcRenderer.invoke('core:assets:create', args),
    //   delete: (...args) => ipcRenderer.invoke('core:assets:delete', args),
    // },
    // // snapshots: {
    // //   commitHistory: (...args) =>
    // //     ipcRenderer.invoke('core:snapshots:commitHistory', args),
    // //   list: (...args) => ipcRenderer.invoke('core:snapshots:list', args),
    // // },
    // collections: {
    //   list: (...args) => ipcRenderer.invoke('core:collections:list', args),
    //   create: (...args) => ipcRenderer.invoke('core:collections:create', args),
    //   read: (...args) => ipcRenderer.invoke('core:collections:read', args),
    //   update: (...args) => ipcRenderer.invoke('core:collections:update', args),
    //   delete: (...args) => ipcRenderer.invoke('core:collections:delete', args),
    // },
    // entries: {
    //   list: (...args) => ipcRenderer.invoke('core:entries:list', args),
    //   create: (...args) => ipcRenderer.invoke('core:entries:create', args),
    //   read: (...args) => ipcRenderer.invoke('core:entries:read', args),
    //   update: (...args) => ipcRenderer.invoke('core:entries:update', args),
    //   delete: (...args) => ipcRenderer.invoke('core:entries:delete', args),
    // },
//     // sharedValues: {
//     //   list: (...args) => ipcRenderer.invoke('core:sharedValues:list', args),
//     //   create: (...args) => ipcRenderer.invoke('core:sharedValues:create', args),
//     //   read: (...args) => ipcRenderer.invoke('core:sharedValues:read', args),
//     //   update: (...args) => ipcRenderer.invoke('core:sharedValues:update', args),
//     //   delete: (...args) => ipcRenderer.invoke('core:sharedValues:delete', args),
//     // },
//   },
// };

// contextBridge.exposeInMainWorld('ipc', exposedApi);
