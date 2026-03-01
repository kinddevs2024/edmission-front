import { api } from './api'
import type { NotificationItem, NotificationType } from '@/store/notificationStore'
import type { Role } from '@/types/user'

export interface NotificationsResponse {
  data: NotificationItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

function mapApiItem(raw: ApiNotificationItem, role: Role | null): NotificationItem {
  const read = !!raw.readAt
  return {
    id: raw.id,
    type: (raw.type as NotificationType) ?? 'info',
    title: raw.title ?? '',
    body: raw.body,
    read,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    link: raw.link ?? buildNotificationLink(raw.type, raw.referenceId, raw.metadata, role),
    referenceId: raw.referenceId,
    referenceType: raw.referenceType,
    metadata: raw.metadata,
  }
}

interface ApiNotificationItem {
  id: string
  type: string
  title?: string
  body?: string
  readAt?: string | null
  createdAt?: string
  link?: string
  referenceId?: string
  referenceType?: string
  metadata?: Record<string, unknown>
}

export function buildNotificationLink(
  type: string,
  referenceId?: string,
  _metadata?: Record<string, unknown>,
  role?: Role | null
): string | undefined {
  const chatPath = role === 'student' ? '/student/chat' : role === 'university' ? '/university/chat' : '/student/chat'
  switch (type) {
    case 'message':
      return referenceId ? `${chatPath}?chatId=${referenceId}` : chatPath
    case 'offer':
      return '/student/offers'
    case 'offer_accepted':
    case 'offer_declined':
    case 'interest':
      return '/university/pipeline'
    case 'status_update':
      return '/student/applications'
    default:
      return undefined
  }
}

export async function getNotifications(
  params?: { page?: number; limit?: number; type?: string; unread?: boolean },
  role?: Role | null
): Promise<NotificationsResponse> {
  const q: Record<string, string | number | boolean | undefined> = {}
  if (params?.page != null) q.page = params.page
  if (params?.limit != null) q.limit = params.limit
  if (params?.type) q.type = params.type
  if (params?.unread !== undefined) q.unread = params.unread
  const { data } = await api.get<{
    data: ApiNotificationItem[]
    total: number
    page: number
    limit: number
    totalPages: number
  }>('/notifications', { params: q })
  return {
    ...data,
    data: (data.data ?? []).map((n) => mapApiItem(n, role ?? null)),
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/notifications/read-all')
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`)
}

export interface DeleteBulkParams {
  ids?: string[]
  readOnly?: boolean
  beforeDate?: string
}

export async function deleteNotificationsBulk(params: DeleteBulkParams): Promise<{ deletedCount: number }> {
  const { data } = await api.delete<{ deletedCount: number }>('/notifications/bulk', { data: params })
  return data
}
