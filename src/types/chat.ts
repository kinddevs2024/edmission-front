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
  acceptedAt?: string
  acceptancePositionType?: string
  acceptancePositionLabel?: string
}

export type MessageType = 'text' | 'voice' | 'emotion' | 'system'

export interface Message {
  id: string
  chatId?: string
  senderId?: string
  sender?: { id: string }
  type?: MessageType
  text: string
  message?: string
  createdAt: string
  read?: boolean
  isFromMe?: boolean
  attachmentUrl?: string
  metadata?: {
    subtype?: string
    emotion?: string
    positionType?: string
    positionLabel?: string
    congratulatoryMessage?: string
  }
}
