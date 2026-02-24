import { api } from './api'

export async function sendAIChat(message: string): Promise<{ text: string }> {
  const { data } = await api.post<{ text: string }>('/ai/chat', { message })
  return data
}
