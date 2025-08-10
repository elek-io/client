import type { ElectronAPI } from '@electron-toolkit/preload';
import type ElekIoCore from '@elek-io/core';
import type { Dialog } from 'electron';

declare global {
  interface ContextBridgeApi {
    electron: {
      process: ElectronAPI['process'];
      dialog: {
        showOpenDialog: Dialog['showOpenDialog'];
        showSaveDialog: Dialog['showSaveDialog'];
      };
    };
    core: {
      api: {
        start: ElekIoCore['api']['start'];
        isRunning: ElekIoCore['api']['isRunning'];
        stop: ElekIoCore['api']['stop'];
      };
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
  interface Window {
    ipc: ContextBridgeApi;
  }
}
