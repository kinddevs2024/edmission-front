import { api } from './api'
import type { Chat, Message } from '@/types/chat'

export async function getChats(): Promise<Chat[]> {
  const { data } = await api.get<Chat[]>('/chat')
  return data
}

export async function getMessages(chatId: string, params?: { before?: string }): Promise<Message[]> {
  const { data } = await api.get<Message[]>(`/chat/${chatId}/messages`, { params })
  return data
}

export async function sendMessage(chatId: string, text: string): Promise<Message> {
  const { data } = await api.post<Message>(`/chat/${chatId}/messages`, { text })
  return data
}

export async function markAsRead(chatId: string): Promise<void> {
  await api.post(`/chat/${chatId}/read`)
}
