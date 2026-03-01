import { api } from './api'
import type { Chat, Message } from '@/types/chat'

type RawChat = {
  id: string
  universityId?: { universityName?: string; logoUrl?: string; _id?: unknown }
  studentId?: { firstName?: string; lastName?: string; avatarUrl?: string; _id?: unknown }
  university?: { universityName?: string; logoUrl?: string }
  student?: { firstName?: string; lastName?: string; avatarUrl?: string }
  lastMessage?: Array<{ message?: string; text?: string; createdAt?: string; senderId?: { id?: string; _id?: unknown } }>
  messages?: Array<{ message?: string; text?: string; createdAt?: string }>
  acceptedAt?: string
  acceptancePositionType?: string
  acceptancePositionLabel?: string
}

function normalizeChat(raw: RawChat, currentUserRole: 'student' | 'university'): Chat {
  const other = raw.universityId ?? raw.university ?? raw.studentId ?? raw.student
  const name =
    other && typeof other === 'object' && 'universityName' in other
      ? String((other as { universityName?: string }).universityName ?? '')
      : other && typeof other === 'object'
        ? [((other as { firstName?: string }).firstName ?? ''), ((other as { lastName?: string }).lastName ?? '')].filter(Boolean).join(' ') || '—'
        : '—'
  const avatar = other && typeof other === 'object' && 'logoUrl' in other ? (other as { logoUrl?: string }).logoUrl : (other as { avatarUrl?: string } | undefined)?.avatarUrl
  const lastMsgArr = raw.lastMessage ?? raw.messages ?? []
  const lastMsg = lastMsgArr[0]
  return {
    id: raw.id,
    participant: {
      id: other && typeof other === 'object' && '_id' in other ? String((other as { _id: unknown })._id) : raw.id,
      name,
      avatar,
      type: currentUserRole === 'student' ? 'university' : 'student',
    },
    lastMessage: lastMsg
      ? {
          text: String(lastMsg.message ?? lastMsg.text ?? ''),
          createdAt: String(lastMsg.createdAt ?? ''),
          isFromMe: false,
        }
      : undefined,
    unreadCount: 0,
    updatedAt: lastMsg?.createdAt ?? new Date().toISOString(),
    acceptedAt: raw.acceptedAt,
    acceptancePositionType: raw.acceptancePositionType,
    acceptancePositionLabel: raw.acceptancePositionLabel,
  }
}

export async function getChats(currentUserRole: 'student' | 'university'): Promise<Chat[]> {
  const { data } = await api.get<RawChat[]>('/chat')
  const list = Array.isArray(data) ? data : []
  return list.map((c) => normalizeChat(c, currentUserRole))
}

export async function createChat(params: { studentId?: string; universityId?: string }): Promise<Chat> {
  const { data } = await api.post<RawChat>('/chat', params)
  const role = params.studentId ? 'university' : 'student'
  return normalizeChat(data, role)
}

type MessagesResponse = { data?: Array<Record<string, unknown>>; total?: number; page?: number; limit?: number; totalPages?: number }

export async function getMessages(chatId: string, params?: { page?: number; limit?: number }): Promise<Message[]> {
  const { data } = await api.get<Message[] | MessagesResponse>(`/chat/${chatId}/messages`, { params })
  const raw = Array.isArray(data) ? data : (data as MessagesResponse)?.data ?? []
  const list = raw as Record<string, unknown>[]
  return list.map((m) => ({
    ...m,
    id: String(m.id ?? m._id),
    text: String(m.text ?? m.message ?? ''),
    type: (m.type as Message['type']) ?? 'text',
    attachmentUrl: m.attachmentUrl,
    metadata: m.metadata,
    createdAt: m.createdAt,
    read: m.isRead ?? m.read,
  })) as Message[]
}

export type SendMessageParams = {
  text?: string
  type?: 'text' | 'voice' | 'emotion'
  attachmentUrl?: string
  metadata?: Record<string, unknown>
}

export async function sendMessage(chatId: string, params: string | SendMessageParams): Promise<Message> {
  const body = typeof params === 'string' ? { text: params } : params
  const { data } = await api.post<Message>(`/chat/${chatId}/messages`, body)
  return data
}

export type AcceptStudentParams = {
  positionType: 'budget' | 'grant' | 'other'
  positionLabel?: string
  congratulatoryMessage: string
}

export async function acceptStudent(chatId: string, params: AcceptStudentParams): Promise<{ message: Message; chat: { id: string; acceptedAt: string; acceptancePositionType?: string; acceptancePositionLabel?: string } }> {
  const { data } = await api.post<{ message: Message; chat: { id: string; acceptedAt: string; acceptancePositionType?: string; acceptancePositionLabel?: string } }>(`/chat/${chatId}/accept`, params)
  return data
}

export async function markAsRead(chatId: string): Promise<void> {
  await api.post(`/chat/${chatId}/read`)
}
