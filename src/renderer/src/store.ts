import type {} from '@redux-devtools/extension'; // required for devtools typing
import { toast } from '@renderer/components/ui/toast';
import { Icon } from '@renderer/util';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export enum NotificationIntent {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  DANGER = 'danger',
}

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
    addNotification: (notification) => {
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
    setIsProjectSidebarNarrow: (isNarrow) => {
      set((state) => ({
        isProjectSidebarNarrow: isNarrow,
      }));
    },
    isProjectSearchDialogOpen: false,
    setProjectSearchDialogOpen: (isOpen) => {
      set((state) => ({
        isProjectSearchDialogOpen: isOpen,
      }));
    },
    breadcrumbLookupMap: new Map(),
  }))
);
