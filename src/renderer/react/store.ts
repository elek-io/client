import { NotificationIntent, NotificationProps } from '@elek-io/ui';
import type {} from '@redux-devtools/extension'; // required for devtools typing
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { toast } from './components/ui/toast';

export interface StoreState {
  notifications: {}[];
  addNotification: (notification: NotificationProps) => void;
  isProjectSidebarNarrow: boolean;
  setIsProjectSidebarNarrow: (isNarrow: boolean) => void;
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
        case NotificationIntent.WARNING:
          toast.warning(notification.title, {
            description: notification.description,
          });
        case NotificationIntent.DANGER:
          toast.error(notification.title, {
            description: notification.description,
            important: true,
          });
        default:
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
  }))
);
