import { ContextBridgeApi } from '../preload';

declare global {
  interface Window {
    ipc: ContextBridgeApi;
  }
}

export const ipc = window.ipc;
