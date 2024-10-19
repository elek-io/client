import type { ElectronAPI } from '@electron-toolkit/preload';
import type { ElekIoCore } from '@elek-io/core';
import type { Dialog as ElectronDialog } from 'electron';

export interface Ipc {
  electron: {
    process: ElectronAPI['process'];
    dialog: {
      showOpenDialog: ElectronDialog['showOpenDialog'];
      showSaveDialog: ElectronDialog['showSaveDialog'];
    };
  };
  core: ElekIoCore;
}

export const ipc = window.ipc as Ipc;
