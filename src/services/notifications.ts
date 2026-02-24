import { api } from './api'
import type { NotificationItem } from '@/store/notificationStore'

export async function getNotifications(params?: { limit?: number }): Promise<NotificationItem[]> {
  const { data } = await api.get<NotificationItem[]>('/notifications', { params })
  return data
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.post(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post('/notifications/read-all')
}
