import { api } from './api'
import type { Chat, Message } from '@/types/chat'

export async function getChats(): Promise<Chat[]> {
  const { data } = await api.get<Chat[]>('/chat')
  return data
}

type MessagesResponse = { data?: Array<Record<string, unknown>>; total?: number; page?: number; limit?: number; totalPages?: number }

export async function getMessages(chatId: string, params?: { page?: number; limit?: number }): Promise<Message[]> {
  const { data } = await api.get<Message[] | MessagesResponse>(`/chat/${chatId}/messages`, { params })
  const raw = Array.isArray(data) ? data : (data as MessagesResponse)?.data ?? []
  const list = raw as Record<string, unknown>[]
  return list.map((m) => ({
    ...m,
    id: String(m.id ?? m._id),
    text: String(m.text ?? m.message),
    createdAt: m.createdAt,
    read: m.isRead ?? m.read,
  })) as Message[]
}

export async function sendMessage(chatId: string, text: string): Promise<Message> {
  const { data } = await api.post<Message>(`/chat/${chatId}/messages`, { text })
  return data
}

export async function markAsRead(chatId: string): Promise<void> {
  await api.post(`/chat/${chatId}/read`)
}
