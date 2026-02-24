export interface Chat {
  id: string
  participant: {
    id: string
    name: string
    avatar?: string
    type: 'university' | 'student'
  }
  lastMessage?: {
    text: string
    createdAt: string
    isFromMe: boolean
    read?: boolean
  }
  unreadCount: number
  updatedAt: string
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  text: string
  createdAt: string
  read?: boolean
  isFromMe?: boolean
}
