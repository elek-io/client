// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import type Core from '@elek-io/core';
import { contextBridge, ipcRenderer, type Dialog } from 'electron';

export interface ContextBridgeApi {
  electron: {
    dialog: {
      showOpenDialog: Dialog['showOpenDialog'];
    };
  };
  core: {
    user: {
      get: Core['user']['get'];
      set: Core['user']['set'];
    };
    projects: {
      create: Core['projects']['create'];
      count: Core['projects']['count'];
      list: Core['projects']['list'];
      read: Core['projects']['read'];
      update: Core['projects']['update'];
      delete: Core['projects']['delete'];
      search: Core['projects']['search'];
    };
    assets: {
      list: Core['assets']['list'];
      create: Core['assets']['create'];
      delete: Core['assets']['delete'];
    };
    collections: {
      list: Core['collections']['list'];
      create: Core['collections']['create'];
      read: Core['collections']['read'];
      update: Core['collections']['update'];
      delete: Core['collections']['delete'];
    };
    entries: {
      list: Core['entries']['list'];
      create: Core['entries']['create'];
      read: Core['entries']['read'];
      update: Core['entries']['update'];
      delete: Core['entries']['delete'];
    };
  };
}

const exposedApi: ContextBridgeApi = {
  electron: {
    dialog: {
      // @ts-ignore -> Why?
      showOpenDialog: (...args) =>
        ipcRenderer.invoke('electron:dialog:showOpenDialog', args),
    },
  },
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
      search: (...args) => ipcRenderer.invoke('core:projects:search', args),
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
  },
};

contextBridge.exposeInMainWorld('ipc', exposedApi);
