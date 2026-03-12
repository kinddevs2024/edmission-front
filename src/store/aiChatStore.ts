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
  isDrawerOpen: boolean
  selectionAsk: SelectionAsk | null
  setMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void
  addMessage: (msg: ChatMessage) => void
  updateMessage: (id: string, updater: (m: ChatMessage) => ChatMessage) => void
  removeMessage: (id: string) => void
  setDrawerOpen: (open: boolean) => void
  toggleDrawer: () => void
  setSelectionAsk: (sel: SelectionAsk | null) => void
  clearChat: () => void
}

export const useAIChatStore = create<AIChatState>((set) => ({
  messages: [],
  isDrawerOpen: false,
  selectionAsk: null,
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
  clearChat: () => set({ messages: [], selectionAsk: null }),
}))
