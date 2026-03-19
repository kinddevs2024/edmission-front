import i18n from '@/i18n'
import type { Message } from '@/types/chat'

type MessageLike = Pick<Message, 'type' | 'text' | 'message' | 'metadata'>

function getDisplayText(message: MessageLike): string {
  return String(message.text ?? message.message ?? '')
}

function getDocumentTypeLabel(type?: string): string {
  if (type === 'offer') {
    return i18n.t('chat:documentTypeOffer', 'offer')
  }
  if (type === 'scholarship') {
    return i18n.t('chat:documentTypeScholarship', 'scholarship')
  }
  return i18n.t('documents:common.document', 'document')
}

export function getLocalizedChatMessageText(message: MessageLike): string {
  const type = message.type ?? 'text'
  const displayText = getDisplayText(message)

  if (type === 'voice') {
    return i18n.t('chat:voiceMessage', { defaultValue: 'Voice message' })
  }

  if (type === 'emotion') {
    return String(message.metadata?.emotion ?? i18n.t('chat:reaction', { defaultValue: 'Reaction' }))
  }

  if (type !== 'system') {
    return displayText
  }

  const subtype = message.metadata?.subtype
  if (subtype === 'chat_opened') {
    const university = String(message.metadata?.universityName ?? '').trim()
    return i18n.t('chat:systemChatOpened', {
      university,
      defaultValue: university
        ? '{{university}} opened the chat. You can now communicate with this university here.'
        : displayText,
    })
  }

  if (subtype === 'acceptance') {
    const position = String(message.metadata?.positionLabel ?? message.metadata?.positionType ?? '').trim()
    return i18n.t('chat:systemAcceptance', {
      position,
      defaultValue: position
        ? 'The university has accepted you for: {{position}}. Congratulations!'
        : displayText,
    })
  }

  if (subtype === 'document_sent') {
    const documentType = getDocumentTypeLabel(message.metadata?.documentType)
    return i18n.t('chat:systemDocumentSent', {
      type: documentType,
      defaultValue: 'University sent you {{type}}',
    })
  }

  if (subtype === 'document_viewed') {
    return i18n.t('chat:systemDocumentViewed', { defaultValue: 'Student viewed the document' })
  }

  if (subtype === 'document_postponed') {
    const postponeUntil = String(message.metadata?.postponeUntil ?? '').slice(0, 10)
    return i18n.t('chat:systemDocumentPostponed', {
      date: postponeUntil,
      defaultValue: postponeUntil ? 'Student postponed the decision until {{date}}' : displayText,
    })
  }

  return i18n.t('chat:systemMessageFallback', { defaultValue: displayText })
}
