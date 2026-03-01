import { create } from 'zustand'

export type NotificationType =
  | 'message'
  | 'offer'
  | 'offer_accepted'
  | 'offer_declined'
  | 'interest'
  | 'status_update'
  | 'new_university'
  | 'recommendation'
  | 'deadline_reminder'
  | 'profile_reminder'
  | 'verification'
  | 'system'
  | 'info'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  body?: string
  read: boolean
  createdAt: string
  link?: string
  referenceId?: string
  referenceType?: string
  metadata?: Record<string, unknown>
}

interface NotificationState {
  items: NotificationItem[]
  unreadCount: number
  setNotifications: (items: NotificationItem[]) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  removeNotifications: (ids: string[]) => void
  addNotification: (item: Omit<NotificationItem, 'id' | 'read' | 'createdAt'> & { id?: string; createdAt?: string }) => void
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
  removeNotification: (id) =>
    set((s) => {
      const items = s.items.filter((n) => n.id !== id)
      return {
        items,
        unreadCount: items.filter((n) => !n.read).length,
      }
    }),
  removeNotifications: (ids) =>
    set((s) => {
      const idSet = new Set(ids)
      const items = s.items.filter((n) => !idSet.has(n.id))
      return {
        items,
        unreadCount: items.filter((n) => !n.read).length,
      }
    }),
  addNotification: (item) =>
    set((s) => {
      const newItem: NotificationItem = {
        ...item,
        id: item.id ?? `n-${Date.now()}`,
        read: false,
        createdAt: item.createdAt ?? new Date().toISOString(),
      }
      return {
        items: [newItem, ...s.items].slice(0, 50),
        unreadCount: s.unreadCount + 1,
      }
    }),
}))
