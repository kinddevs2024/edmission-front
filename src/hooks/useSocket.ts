import { useEffect, useRef, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/authStore'

const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL
  if (apiUrl) {
    try {
      const u = new URL(apiUrl)
      return `${u.protocol === 'https:' ? 'wss:' : 'ws:'}//${u.host}`
    } catch {
      return window.location.origin
    }
  }
  // Локально (dev): сокет на бэкенд (4000), как и API
  if (import.meta.env.DEV) return 'http://localhost:4000'
  return window.location.origin
}

let socketInstance: Socket | null = null

export function useSocket() {
  const token = useAuthStore((s) => s.accessToken)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const connectedRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketInstance) {
        socketInstance.disconnect()
        socketInstance = null
        connectedRef.current = false
      }
      return
    }

    if (socketInstance?.connected) return

    const url = getSocketUrl()
    socketInstance = io(url, {
      auth: { token },
      query: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketInstance.on('connect', () => {
      connectedRef.current = true
    })
    socketInstance.on('disconnect', () => {
      connectedRef.current = false
    })

    return () => {
      if (socketInstance) {
        socketInstance.removeAllListeners()
        socketInstance.disconnect()
        socketInstance = null
        connectedRef.current = false
      }
    }
  }, [isAuthenticated, token])

  const joinChat = useCallback((chatId: string) => {
    if (socketInstance?.connected) {
      socketInstance.emit('join_chat', { chatId })
    }
  }, [])

  const leaveChat = useCallback((chatId: string) => {
    if (socketInstance?.connected) {
      socketInstance.emit('leave_chat', { chatId })
    }
  }, [])

  const onNewMessage = useCallback((callback: (msg: { chatId: string; message: unknown }) => void) => {
    if (!socketInstance) return () => {}
    socketInstance.on('new_message', callback)
    return () => {
      socketInstance?.off('new_message', callback)
    }
  }, [])

  const onRead = useCallback((callback: (data: { chatId: string; messageId?: string }) => void) => {
    if (!socketInstance) return () => {}
    socketInstance.on('read', callback)
    return () => {
      socketInstance?.off('read', callback)
    }
  }, [])

  const onNotification = useCallback(
    (callback: (payload: { id: string; type: string; title: string; body?: string; link?: string; referenceId?: string; createdAt?: string; metadata?: Record<string, unknown> }) => void) => {
      if (!socketInstance) return () => {}
      socketInstance.on('notification', callback)
      return () => socketInstance?.off('notification', callback)
    },
    []
  )

  const onMessageUpdated = useCallback((callback: (payload: { chatId: string; message: unknown }) => void) => {
    if (!socketInstance) return () => {}
    socketInstance.on('message_updated', callback)
    return () => {
      socketInstance?.off('message_updated', callback)
    }
  }, [])

  const onMessageDeleted = useCallback((callback: (payload: { chatId: string; messageId: string; scope: 'me' | 'everyone' }) => void) => {
    if (!socketInstance) return () => {}
    socketInstance.on('message_deleted', callback)
    return () => {
      socketInstance?.off('message_deleted', callback)
    }
  }, [])

  const emitTyping = useCallback((chatId: string, isTyping: boolean) => {
    if (socketInstance?.connected) {
      socketInstance.emit('typing', { chatId, isTyping })
    }
  }, [])

  const isConnected = () => connectedRef.current && socketInstance?.connected

  return {
    socket: socketInstance,
    joinChat,
    leaveChat,
    onNewMessage,
    onRead,
    onMessageUpdated,
    onMessageDeleted,
    onNotification,
    emitTyping,
    isConnected,
  }
}
