import { type ElectronAPI } from '@electron-toolkit/preload';
import { type ElekIoCore } from '@elek-io/core';

declare global {
  interface Window {
    ipc: {
      electron: ElectronAPI;
      core: ElekIoCore;
    };
  }
}
