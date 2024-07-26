// // See the Electron documentation for details on how to use preload scripts:
// // https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { ElectronAPI, electronAPI } from '@electron-toolkit/preload';
import ElekIoCore from '@elek-io/core';
import { contextBridge, ipcRenderer } from 'electron';

export interface ContextBridgeApi {
  electron: ElectronAPI;
  core: {
    user: {
      get: ElekIoCore['user']['get'];
      set: ElekIoCore['user']['set'];
    };
    projects: {
      create: ElekIoCore['projects']['create'];
      count: ElekIoCore['projects']['count'];
      list: ElekIoCore['projects']['list'];
      read: ElekIoCore['projects']['read'];
      update: ElekIoCore['projects']['update'];
      delete: ElekIoCore['projects']['delete'];
    };
    assets: {
      list: ElekIoCore['assets']['list'];
      create: ElekIoCore['assets']['create'];
      delete: ElekIoCore['assets']['delete'];
    };
    collections: {
      list: ElekIoCore['collections']['list'];
      create: ElekIoCore['collections']['create'];
      read: ElekIoCore['collections']['read'];
      update: ElekIoCore['collections']['update'];
      delete: ElekIoCore['collections']['delete'];
    };
    entries: {
      list: ElekIoCore['entries']['list'];
      create: ElekIoCore['entries']['create'];
      read: ElekIoCore['entries']['read'];
      update: ElekIoCore['entries']['update'];
      delete: ElekIoCore['entries']['delete'];
    };
  };
}

// Custom APIs for renderer
const ipc: ContextBridgeApi = {
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

contextBridge.exposeInMainWorld('ipc', ipc);
