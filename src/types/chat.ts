export interface Chat {
  id: string
  participant: {
    id: string
    name: string
    avatar?: string
    type: 'university' | 'student'
  }
  lastMessage?: {
    id?: string
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
  isReadOnly?: boolean
  readOnlyReason?: string
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
  editedAt?: string
  read?: boolean
  isFromMe?: boolean
  attachmentUrl?: string
  metadata?: {
    subtype?: string
    emotion?: string
    positionType?: string
    positionLabel?: string
    congratulatoryMessage?: string
    documentId?: string
    documentType?: 'offer' | 'scholarship'
    title?: string
    link?: string
    fileName?: string
    fileSize?: number
    mimeType?: string
    postponeUntil?: string
    replyToMessageId?: string
    replyToPreview?: string
    sentByAdmin?: boolean
    senderRole?: string
    senderLabel?: string
    senderEmail?: string
  }
}
