// // See the Electron documentation for details on how to use preload scripts:
// // https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { ElectronAPI, electronAPI } from '@electron-toolkit/preload';
import ElekIoCore from '@elek-io/core';
import { contextBridge, Dialog, ipcRenderer } from 'electron';

export interface ContextBridgeApi {
  electron: {
    process: ElectronAPI['process'];
    dialog: {
      showOpenDialog: Dialog['showOpenDialog'];
      showSaveDialog: Dialog['showSaveDialog'];
    };
  };
  core: {
    logger: {
      debug: ElekIoCore['logger']['debug'];
      info: ElekIoCore['logger']['info'];
      warn: ElekIoCore['logger']['warn'];
      error: ElekIoCore['logger']['error'];
      read: ElekIoCore['logger']['read'];
    };
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
      getChanges: ElekIoCore['projects']['getChanges'];
      synchronize: ElekIoCore['projects']['synchronize'];
      clone: ElekIoCore['projects']['clone'];
      setRemoteOriginUrl: ElekIoCore['projects']['setRemoteOriginUrl'];
      delete: ElekIoCore['projects']['delete'];
    };
    assets: {
      list: ElekIoCore['assets']['list'];
      create: ElekIoCore['assets']['create'];
      read: ElekIoCore['assets']['read'];
      update: ElekIoCore['assets']['update'];
      delete: ElekIoCore['assets']['delete'];
      save: ElekIoCore['assets']['save'];
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
  electron: {
    process: electronAPI.process,
    dialog: {
      showOpenDialog: (options: Electron.OpenDialogOptions) =>
        ipcRenderer.invoke('electron:dialog:showOpenDialog', [options]),
      showSaveDialog: (options: Electron.SaveDialogOptions) =>
        ipcRenderer.invoke('electron:dialog:showSaveDialog', [options]),
    },
  },
  core: {
    logger: {
      debug: (...args) => ipcRenderer.invoke('core:logger:debug', args),
      info: (...args) => ipcRenderer.invoke('core:logger:info', args),
      warn: (...args) => ipcRenderer.invoke('core:logger:warn', args),
      error: (...args) => ipcRenderer.invoke('core:logger:error', args),
      read: (...args) => ipcRenderer.invoke('core:logger:read', args),
    },
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
      getChanges: (...args) =>
        ipcRenderer.invoke('core:projects:getChanges', args),
      synchronize: (...args) =>
        ipcRenderer.invoke('core:projects:synchronize', args),
      clone: (...args) => ipcRenderer.invoke('core:projects:clone', args),
      setRemoteOriginUrl: (...args) =>
        ipcRenderer.invoke('core:projects:setRemoteOriginUrl', args),
      delete: (...args) => ipcRenderer.invoke('core:projects:delete', args),
    },
    assets: {
      list: (...args) => ipcRenderer.invoke('core:assets:list', args),
      create: (...args) => ipcRenderer.invoke('core:assets:create', args),
      read: (...args) => ipcRenderer.invoke('core:assets:read', args),
      update: (...args) => ipcRenderer.invoke('core:assets:update', args),
      delete: (...args) => ipcRenderer.invoke('core:assets:delete', args),
      save: (...args) => ipcRenderer.invoke('core:assets:save', args),
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
