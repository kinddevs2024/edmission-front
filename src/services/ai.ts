import { api } from './api'

export async function sendAIChat(message: string): Promise<{ text: string }> {
  const { data } = await api.post<{ reply: string }>('/ai/chat', { message })
  return { text: data.reply ?? '' }
}
