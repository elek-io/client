import { type ContextBridgeApi } from './index';

declare global {
  interface Window {
    ipc: ContextBridgeApi;
  }
}
