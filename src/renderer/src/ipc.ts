import { ElectronAPI } from '@electron-toolkit/preload';
import type Core from '@elek-io/core';

declare global {
  interface Window {
    ipc: {
      electron: ElectronAPI
      core: Core
    }
  }
}

export const ipc = window.ipc;
