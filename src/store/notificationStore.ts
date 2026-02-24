import { create } from 'zustand'

export interface NotificationItem {
  id: string
  type: 'offer' | 'message' | 'status_update' | 'info'
  title: string
  body?: string
  read: boolean
  createdAt: string
  link?: string
}

interface NotificationState {
  items: NotificationItem[]
  unreadCount: number
  setNotifications: (items: NotificationItem[]) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  addNotification: (item: Omit<NotificationItem, 'id' | 'read' | 'createdAt'>) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  unreadCount: 0,
  setNotifications: (items) =>
    set({
      items,
      unreadCount: items.filter((n) => !n.read).length,
    }),
  markAsRead: (id) =>
    set((s) => {
      const items = s.items.map((n) => (n.id === id ? { ...n, read: true } : n))
      return {
        items,
        unreadCount: items.filter((n) => !n.read).length,
      }
    }),
  markAllAsRead: () =>
    set((s) => ({
      items: s.items.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  addNotification: (item) =>
    set((s) => {
      const newItem: NotificationItem = {
        ...item,
        id: `n-${Date.now()}`,
        read: false,
        createdAt: new Date().toISOString(),
      }
      return {
        items: [newItem, ...s.items].slice(0, 50),
        unreadCount: s.unreadCount + 1,
      }
    }),
}))
