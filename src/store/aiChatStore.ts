/**
 * Global AI chat state: persists across page navigation, cleared on full refresh.
 * Shared by AIChatDrawer and AIChatPage so chat stays open and messages are preserved
 * when navigating between pages (e.g. /student/dashboard <-> /ai).
 */

import { create } from 'zustand'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  thinking?: string
}

export interface SelectionAsk {
  text: string
  messageId: string
}

interface AIChatState {
  messages: ChatMessage[]
  /** Which assistant bubble is receiving the active stream (drawer or full page). */
  streamingAssistantId: string | null
  isDrawerOpen: boolean
  selectionAsk: SelectionAsk | null
  sessionId: string
  requestLimit: number
  requestsUsed: number
  setStreamingAssistantId: (id: string | null) => void
  setMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void
  addMessage: (msg: ChatMessage) => void
  updateMessage: (id: string, updater: (m: ChatMessage) => ChatMessage) => void
  removeMessage: (id: string) => void
  setDrawerOpen: (open: boolean) => void
  toggleDrawer: () => void
  setSelectionAsk: (sel: SelectionAsk | null) => void
  incrementRequestsUsed: () => void
  clearChat: () => void
  resetSession: () => void
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `ai-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export const useAIChatStore = create<AIChatState>((set) => ({
  messages: [],
  streamingAssistantId: null,
  isDrawerOpen: false,
  selectionAsk: null,
  sessionId: createSessionId(),
  requestLimit: 10,
  requestsUsed: 0,
  setStreamingAssistantId: (id) => set({ streamingAssistantId: id }),
  setMessages: (msgs) =>
    set((s) => ({
      messages: typeof msgs === 'function' ? msgs(s.messages) : msgs,
    })),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateMessage: (id, updater) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? updater(m) : m)),
    })),
  removeMessage: (id) => set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),
  setDrawerOpen: (open) => set({ isDrawerOpen: open }),
  toggleDrawer: () => set((s) => ({ isDrawerOpen: !s.isDrawerOpen })),
  setSelectionAsk: (sel) => set({ selectionAsk: sel }),
  incrementRequestsUsed: () => set((s) => ({ requestsUsed: s.requestsUsed + 1 })),
  clearChat: () => set({ messages: [], selectionAsk: null, streamingAssistantId: null }),
  resetSession: () =>
    set({
      messages: [],
      streamingAssistantId: null,
      isDrawerOpen: false,
      selectionAsk: null,
      sessionId: createSessionId(),
      requestsUsed: 0,
    }),
}))
