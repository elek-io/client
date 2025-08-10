// // See the Electron documentation for details on how to use preload scripts:
// // https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { electronAPI } from '@electron-toolkit/preload';
import {
  BaseWindow,
  contextBridge,
  ipcRenderer,
  OpenDialogOptions,
  SaveDialogOptions,
} from 'electron';

const ipc: ContextBridgeApi = {
  electron: {
    process: electronAPI.process,
    dialog: {
      showOpenDialog: (
        windowOrOptions: BaseWindow | OpenDialogOptions,
        options?: OpenDialogOptions
      ) =>
        ipcRenderer.invoke(
          'electron:dialog:showOpenDialog',
          windowOrOptions,
          options
        ),
      showSaveDialog: (
        windowOrOptions: BaseWindow | SaveDialogOptions,
        options?: SaveDialogOptions
      ) =>
        ipcRenderer.invoke(
          'electron:dialog:showSaveDialog',
          windowOrOptions,
          options
        ),
    },
  },
  core: {
    api: {
      start: (...args) => ipcRenderer.invoke('core:api:start', ...args),
      isRunning: (...args) => ipcRenderer.invoke('core:api:isRunning', ...args),
      stop: (...args) => ipcRenderer.invoke('core:api:stop', ...args),
    },
    logger: {
      debug: (...args) => ipcRenderer.invoke('core:logger:debug', ...args),
      info: (...args) => ipcRenderer.invoke('core:logger:info', ...args),
      warn: (...args) => ipcRenderer.invoke('core:logger:warn', ...args),
      error: (...args) => ipcRenderer.invoke('core:logger:error', ...args),
      read: (...args) => ipcRenderer.invoke('core:logger:read', ...args),
    },
    user: {
      get: (...args) => ipcRenderer.invoke('core:user:get', ...args),
      set: (...args) => ipcRenderer.invoke('core:user:set', ...args),
    },
    projects: {
      count: (...args) => ipcRenderer.invoke('core:projects:count', ...args),
      create: (...args) => ipcRenderer.invoke('core:projects:create', ...args),
      list: (...args) => ipcRenderer.invoke('core:projects:list', ...args),
      read: (...args) => ipcRenderer.invoke('core:projects:read', ...args),
      update: (...args) => ipcRenderer.invoke('core:projects:update', ...args),
      getChanges: (...args) =>
        ipcRenderer.invoke('core:projects:getChanges', ...args),
      synchronize: (...args) =>
        ipcRenderer.invoke('core:projects:synchronize', ...args),
      clone: (...args) => ipcRenderer.invoke('core:projects:clone', ...args),
      setRemoteOriginUrl: (...args) =>
        ipcRenderer.invoke('core:projects:setRemoteOriginUrl', ...args),
      delete: (...args) => ipcRenderer.invoke('core:projects:delete', ...args),
    },
    assets: {
      list: (...args) => ipcRenderer.invoke('core:assets:list', ...args),
      create: (...args) => ipcRenderer.invoke('core:assets:create', ...args),
      read: (...args) => ipcRenderer.invoke('core:assets:read', ...args),
      update: (...args) => ipcRenderer.invoke('core:assets:update', ...args),
      delete: (...args) => ipcRenderer.invoke('core:assets:delete', ...args),
      save: (...args) => ipcRenderer.invoke('core:assets:save', ...args),
    },
    collections: {
      list: (...args) => ipcRenderer.invoke('core:collections:list', ...args),
      create: (...args) =>
        ipcRenderer.invoke('core:collections:create', ...args),
      read: (...args) => ipcRenderer.invoke('core:collections:read', ...args),
      update: (...args) =>
        ipcRenderer.invoke('core:collections:update', ...args),
      delete: (...args) =>
        ipcRenderer.invoke('core:collections:delete', ...args),
    },
    entries: {
      list: (...args) => ipcRenderer.invoke('core:entries:list', ...args),
      create: (...args) => ipcRenderer.invoke('core:entries:create', ...args),
      read: (...args) => ipcRenderer.invoke('core:entries:read', ...args),
      update: (...args) => ipcRenderer.invoke('core:entries:update', ...args),
      delete: (...args) => ipcRenderer.invoke('core:entries:delete', ...args),
    },
  },
};

contextBridge.exposeInMainWorld('ipc', ipc);
