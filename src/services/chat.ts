import { api } from './api'
import type { Chat, Message } from '@/types/chat'

type RawLastMessage = {
  id?: string
  _id?: unknown
  message?: string
  text?: string
  createdAt?: string
  isRead?: boolean
  senderId?: string | { id?: string; _id?: unknown }
}

function rawLastMessageSenderId(last: RawLastMessage | undefined): string | undefined {
  if (!last) return undefined
  const s = last.senderId
  if (typeof s === 'string' && s.trim()) return s
  if (s && typeof s === 'object') {
    if (s.id != null) return String(s.id)
    if (s._id != null) return String(s._id)
  }
  return undefined
}

/** Profile id from populated ref or plain ObjectId string (Mongoose selective populate may omit _id unless listed). */
function extractRefProfileId(ref: unknown): string | undefined {
  if (ref == null) return undefined
  if (typeof ref === 'string') {
    const s = ref.trim()
    return /^[a-f0-9]{24}$/i.test(s) ? s : undefined
  }
  if (typeof ref === 'object' && !Array.isArray(ref)) {
    const o = ref as Record<string, unknown>
    const rawId = o._id ?? o.id
    if (rawId != null && typeof rawId !== 'object') {
      const s = String(rawId).trim()
      if (/^[a-f0-9]{24}$/i.test(s)) return s
    }
    if (rawId != null && typeof rawId === 'object' && rawId !== null && '$oid' in (rawId as object)) {
      const oid = (rawId as { $oid?: string }).$oid
      if (typeof oid === 'string' && /^[a-f0-9]{24}$/i.test(oid)) return oid
    }
  }
  return undefined
}

export function coerceIsoDateString(value: unknown): string {
  if (value == null) return new Date().toISOString()
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? new Date().toISOString() : value.toISOString()
  const d = new Date(typeof value === 'string' || typeof value === 'number' ? value : String(value))
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

type RawChat = {
  id: string
  universityId?: { universityName?: string; logoUrl?: string; _id?: unknown; name?: string; userEmail?: string }
  studentId?: { firstName?: string; lastName?: string; avatarUrl?: string; _id?: unknown; name?: string; userEmail?: string; profileVisibility?: string }
  university?: { universityName?: string; logoUrl?: string; _id?: unknown; name?: string; userEmail?: string }
  student?: { firstName?: string; lastName?: string; avatarUrl?: string; _id?: unknown; name?: string; userEmail?: string; profileVisibility?: string }
  lastMessage?: RawLastMessage[]
  messages?: RawLastMessage[]
  acceptedAt?: string
  acceptancePositionType?: string
  acceptancePositionLabel?: string
  isReadOnly?: boolean
  readOnlyReason?: string
  unreadCount?: number
  /** StudentProfile _id — for university → student profile links */
  studentProfileId?: string
  /** UniversityProfile _id — for student → university catalog page */
  universityProfileId?: string
}

function normalizeChat(raw: RawChat, currentUserRole: 'student' | 'university', viewerUserId?: string | null): Chat {
  const uniLike = raw.universityId ?? raw.university
  const stuLike = raw.studentId ?? raw.student
  /** Counterparty in the thread only — never fall back to "self" or the wrong side for profile links. */
  const partyRef = currentUserRole === 'student' ? uniLike : stuLike

  const uniPid =
    typeof raw.universityProfileId === 'string' && /^[a-f0-9]{24}$/i.test(raw.universityProfileId.trim())
      ? raw.universityProfileId.trim()
      : extractRefProfileId(uniLike)
  const stuPid =
    typeof raw.studentProfileId === 'string' && /^[a-f0-9]{24}$/i.test(raw.studentProfileId.trim())
      ? raw.studentProfileId.trim()
      : extractRefProfileId(stuLike)
  const participantId = currentUserRole === 'student' ? (uniPid ?? '') : (stuPid ?? '')

  let name = '—'
  if (partyRef && typeof partyRef === 'object') {
    const o = partyRef as { universityName?: string; firstName?: string; lastName?: string; name?: string; userEmail?: string }
    if (o.universityName) {
      name = String(o.universityName)
    } else {
      const combined = [o.firstName ?? '', o.lastName ?? ''].filter(Boolean).join(' ')
      name = combined || o.name || o.userEmail || (currentUserRole === 'university' ? 'Student' : '—')
    }
  }

  const avatar =
    partyRef && typeof partyRef === 'object' && 'logoUrl' in partyRef
      ? (partyRef as { logoUrl?: string }).logoUrl
      : (partyRef as { avatarUrl?: string } | undefined)?.avatarUrl
  const lastMsgArr = raw.lastMessage ?? raw.messages ?? []
  const lastMsg = lastMsgArr[0]
  const lastSenderId = rawLastMessageSenderId(lastMsg)
  const lastIsFromMe = Boolean(viewerUserId && lastSenderId && lastSenderId === viewerUserId)
  return {
    id: raw.id,
    participant: {
      id: participantId,
      name,
      avatar,
      type: currentUserRole === 'student' ? 'university' : 'student',
    },
    lastMessage: lastMsg
      ? {
          id: String(lastMsg.id ?? lastMsg._id ?? ''),
          text: String(lastMsg.message ?? lastMsg.text ?? ''),
          createdAt: coerceIsoDateString(lastMsg.createdAt),
          isFromMe: lastIsFromMe,
          read: Boolean(lastMsg.isRead),
        }
      : undefined,
    unreadCount: typeof raw.unreadCount === 'number' && Number.isFinite(raw.unreadCount) ? Math.max(0, Math.floor(raw.unreadCount)) : 0,
    updatedAt: lastMsg?.createdAt ? coerceIsoDateString(lastMsg.createdAt) : new Date().toISOString(),
    acceptedAt: raw.acceptedAt,
    acceptancePositionType: raw.acceptancePositionType,
    acceptancePositionLabel: raw.acceptancePositionLabel,
    isReadOnly: raw.isReadOnly,
    readOnlyReason: raw.readOnlyReason,
  }
}

export async function getChats(currentUserRole: 'student' | 'university', viewerUserId?: string | null): Promise<Chat[]> {
  const { data } = await api.get<RawChat[]>('/chat')
  const list = Array.isArray(data) ? data : []
  return list.map((c) => normalizeChat(c, currentUserRole, viewerUserId))
}

export async function createChat(
  params: { studentId?: string; universityId?: string },
  viewerUserId?: string | null
): Promise<Chat> {
  const { data } = await api.post<RawChat>('/chat', params)
  const role = params.studentId ? 'university' : 'student'
  return normalizeChat(data, role, viewerUserId)
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
    createdAt: coerceIsoDateString(m.createdAt),
    editedAt: m.editedAt,
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

export async function updateMessage(chatId: string, messageId: string, text: string): Promise<Message> {
  const { data } = await api.patch<Message>(`/chat/${chatId}/messages/${messageId}`, { text })
  return data
}

export async function deleteMessage(chatId: string, messageId: string, scope: 'me' | 'everyone'): Promise<{ success: boolean; messageId: string; scope: 'me' | 'everyone' }> {
  const { data } = await api.delete<{ success: boolean; messageId: string; scope: 'me' | 'everyone' }>(`/chat/${chatId}/messages/${messageId}`, {
    data: { scope },
  })
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
