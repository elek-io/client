import { NotificationProps } from '@elek-io/ui';
import type {} from '@redux-devtools/extension'; // required for devtools typing
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface StoreState {
  notifications: NotificationProps[];
  addNotification: (notification: NotificationProps) => void;
}

export const useStore = create<StoreState>()(
  devtools((set) => ({
    notifications: [],
    addNotification: (notification) => {
      console.log('New notification:', notification);
      set((state) => ({
        notifications: [...state.notifications, notification],
      }));
    },
  }))
);
