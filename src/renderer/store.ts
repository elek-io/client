import type {} from '@redux-devtools/extension';
import { toast } from 'sonner';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface NotificationProps {
  intent: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  description: string;
}

export interface StoreState {
  notifications: NotificationProps[];
  addNotification: (notification: NotificationProps) => void;
  isProjectSidebarNarrow: boolean;
  setIsProjectSidebarNarrow: (isNarrow: boolean) => void;
  isProjectSearchDialogOpen: boolean;
  setProjectSearchDialogOpen: (isOpen: boolean) => void;
  breadcrumbLookupMap: Map<string, string>;
}

export const useStore = create<StoreState>()(
  devtools((set) => ({
    notifications: [],
    addNotification: (notification): void => {
      switch (notification.intent) {
        case 'info':
          toast.info(notification.title, {
            description: notification.description,
          });
          break;
        case 'success':
          toast.success(notification.title, {
            description: notification.description,
          });
          break;
        case 'warning':
          toast.warning(notification.title, {
            description: notification.description,
          });
          break;
        case 'danger':
          toast.error(notification.title, {
            description: notification.description,
          });
          break;
      }
      set((state) => ({
        notifications: [...state.notifications, notification],
      }));
    },
    isProjectSidebarNarrow: false,
    setIsProjectSidebarNarrow: (isNarrow): void => {
      set(() => ({
        isProjectSidebarNarrow: isNarrow,
      }));
    },
    isProjectSearchDialogOpen: false,
    setProjectSearchDialogOpen: (isOpen): void => {
      set(() => ({
        isProjectSearchDialogOpen: isOpen,
      }));
    },
    breadcrumbLookupMap: new Map(),
  }))
);
