import { api } from './api'

export interface ChatHistoryItem {
  role: 'user' | 'assistant'
  content: string
}

export interface SendAIChatParams {
  message: string
  history?: ChatHistoryItem[]
  selectedText?: string
}

export async function sendAIChat(params: SendAIChatParams): Promise<{ text: string }> {
  const { data } = await api.post<{ reply: string }>('/ai/chat', {
    message: params.message,
    history: params.history,
    selectedText: params.selectedText,
  })
  return { text: data.reply ?? '' }
}
