import type {} from '@redux-devtools/extension';
import { toast } from 'sonner';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { type Icon } from '@renderer/lib/utils';

export type NotificationIntent = 'info' | 'success' | 'warning' | 'danger';

export const NotificationIntent = {
  INFO: 'info' as NotificationIntent,
  SUCCESS: 'success' as NotificationIntent,
  WARNING: 'warning' as NotificationIntent,
  DANGER: 'danger' as NotificationIntent,
};

export interface NotificationProps {
  intent?: NotificationIntent;
  icon?: Icon;
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
      console.log('New notification:', notification);
      switch (notification.intent) {
        case NotificationIntent.INFO:
          toast.info(notification.title, {
            description: notification.description,
          });
          break;
        case NotificationIntent.SUCCESS:
          toast.success(notification.title, {
            description: notification.description,
          });
          break;
        case NotificationIntent.WARNING:
          toast.warning(notification.title, {
            description: notification.description,
          });
          break;
        case NotificationIntent.DANGER:
          toast.error(notification.title, {
            description: notification.description,
            important: true,
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
