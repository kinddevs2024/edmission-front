import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConversationProvider, useConversation } from '@elevenlabs/react'
import { useTranslation } from 'react-i18next'
import { Bot, Languages, Loader2, Maximize2, MessageCircle, Mic, MicOff, Minimize2, Phone, PhoneOff, Send, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'
import { isUniversityLikeRole } from '@/types/user'

type SupportAgentLanguage = 'en' | 'ru' | 'uz'

const ELEVENLABS_AGENT_IDS: Record<SupportAgentLanguage, string> = {
  en: import.meta.env.VITE_ELEVENLABS_AGENT_ID_EN?.trim() || import.meta.env.VITE_ELEVENLABS_AGENT_ID?.trim() || '',
  ru: import.meta.env.VITE_ELEVENLABS_AGENT_ID_RU?.trim() || import.meta.env.VITE_ELEVENLABS_AGENT_ID?.trim() || '',
  uz: import.meta.env.VITE_ELEVENLABS_AGENT_ID_UZ?.trim() || import.meta.env.VITE_ELEVENLABS_AGENT_ID?.trim() || '',
}

function normalizeAgentLanguage(language?: string): SupportAgentLanguage {
  const code = language?.split('-')[0]?.toLowerCase()
  if (code === 'ru' || code === 'uz') return code
  return 'en'
}

function getSupportAgentId(language?: string) {
  return ELEVENLABS_AGENT_IDS[normalizeAgentLanguage(language)]
}

function getSupportAgentLanguageLabel(language: SupportAgentLanguage) {
  if (language === 'ru') return 'Русский'
  if (language === 'uz') return "O'zbek"
  return 'English'
}

type TranscriptRole = 'user' | 'agent'

interface TranscriptMessage {
  id: string
  role: TranscriptRole
  text: string
  createdAt: number
}

interface ElevenLabsSupportContextValue {
  messages: TranscriptMessage[]
  text: string
  error: string | null
  chatOpen: boolean
  isConnected: boolean
  isConnecting: boolean
  hasStarted: boolean
  isMuted: boolean
  isSpeaking: boolean
  outputLevel: number
  agentLanguage: SupportAgentLanguage
  agentLanguageLabel: string
  inputRef: RefObject<HTMLTextAreaElement>
  messagesEndRef: RefObject<HTMLDivElement>
  setText: (value: string) => void
  setChatOpen: (value: boolean) => void
  startConversation: () => Promise<void>
  endConversation: () => void
  toggleMute: () => void
  openChat: () => void
  sendTextMessage: () => void
}

const ElevenLabsSupportContext = createContext<ElevenLabsSupportContextValue | null>(null)

export function ElevenLabsSupportProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const agentLanguage = normalizeAgentLanguage(i18n.resolvedLanguage || i18n.language)
  const agentId = ELEVENLABS_AGENT_IDS[agentLanguage]

  return (
    <ConversationProvider agentId={agentId}>
      <ElevenLabsSupportSession agentId={agentId} agentLanguage={agentLanguage}>
        {children}
      </ElevenLabsSupportSession>
    </ConversationProvider>
  )
}

export function useElevenLabsSupport() {
  const context = useContext(ElevenLabsSupportContext)
  if (!context) {
    throw new Error('useElevenLabsSupport must be used inside ElevenLabsSupportProvider')
  }
  return context
}

function ElevenLabsSupportSession({
  children,
  agentId,
  agentLanguage,
}: {
  children: ReactNode
  agentId: string
  agentLanguage: SupportAgentLanguage
}) {
  const { role, user } = useAuth()
  const { t, i18n } = useTranslation('common')
  const [messages, setMessages] = useState<TranscriptMessage[]>([])
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [outputLevel, setOutputLevel] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const dynamicVariables = useMemo(
    () => ({
      user_name: user?.name ?? user?.email ?? 'Edmission user',
      user_role: role ?? 'guest',
      interface_language: normalizeAgentLanguage(i18n.resolvedLanguage || i18n.language),
      support_agent_language: agentLanguage,
      current_page: typeof window === 'undefined' ? '/ai' : window.location.pathname,
    }),
    [agentLanguage, i18n.language, i18n.resolvedLanguage, role, user?.email, user?.name]
  )

  const addTranscript = (role: TranscriptRole, text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setMessages((current) => {
      const last = current[current.length - 1]
      if (last?.role === role && last.text === trimmed && Date.now() - last.createdAt < 3000) {
        return current
      }
      return [
        ...current,
        {
          id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          role,
          text: trimmed,
          createdAt: Date.now(),
        },
      ]
    })
  }

  const conversation = useConversation({
    onConnect: () => setError(null),
    onDisconnect: () => {
      setOutputLevel(0)
      setText('')
    },
    onMessage: (message) => addTranscript(message.role, message.message),
    onError: (message) => setError(message),
  })

  const isConnected = conversation.status === 'connected'
  const isConnecting = conversation.status === 'connecting'
  const hasStarted = isConnected || isConnecting

  useEffect(() => {
    if (!isConnected) return
    const timer = window.setInterval(() => {
      setOutputLevel(conversation.getOutputVolume())
    }, 120)
    return () => window.clearInterval(timer)
  }, [conversation, isConnected])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, chatOpen])

  useEffect(() => {
    if (!chatOpen) return
    inputRef.current?.focus()
  }, [chatOpen])

  const startConversation = async () => {
    setError(null)
    if (isConnected || isConnecting) return
    const nextAgentId = agentId || getSupportAgentId(i18n.resolvedLanguage || i18n.language)
    if (!nextAgentId) {
      setError(t('aiSupportAgentMissing', 'ElevenLabs agent ID is not configured.'))
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t('aiSupportMicrophoneUnavailable', 'Microphone access is not available in this browser.'))
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      await conversation.startSession({
        agentId: nextAgentId,
        connectionType: 'websocket',
        workletPaths: {
          rawAudioProcessor: '/elevenlabs-worklets/rawAudioProcessor.js',
          audioConcatProcessor: '/elevenlabs-worklets/audioConcatProcessor.js',
        },
        dynamicVariables: {
          ...dynamicVariables,
          interface_language: normalizeAgentLanguage(i18n.resolvedLanguage || i18n.language),
          support_agent_language: agentLanguage,
          current_page: typeof window === 'undefined' ? dynamicVariables.current_page : window.location.pathname,
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('aiSupportStartFailed', 'Could not start the call.'))
    }
  }

  const endConversation = () => {
    if (isConnected || isConnecting) {
      conversation.endSession()
    }
  }

  const openChat = () => {
    setChatOpen(true)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  const sendTextMessage = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    if (!isConnected) {
      setError(t('aiSupportStartBeforeMessage', 'Start the call before sending a message.'))
      return
    }

    try {
      conversation.sendUserMessage(trimmed)
      addTranscript('user', trimmed)
      setText('')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('aiSupportSendFailed', 'Could not send the message.'))
    }
  }

  const value = useMemo<ElevenLabsSupportContextValue>(
    () => ({
      messages,
      text,
      error,
      chatOpen,
      isConnected,
      isConnecting,
      hasStarted,
      isMuted: conversation.isMuted,
      isSpeaking: conversation.isSpeaking,
      outputLevel,
      agentLanguage,
      agentLanguageLabel: getSupportAgentLanguageLabel(agentLanguage),
      inputRef,
      messagesEndRef,
      setText,
      setChatOpen,
      startConversation,
      endConversation,
      toggleMute: () => conversation.setMuted(!conversation.isMuted),
      openChat,
      sendTextMessage,
    }),
    [
      messages,
      text,
      error,
      chatOpen,
      isConnected,
      isConnecting,
      hasStarted,
      conversation,
      agentLanguage,
      outputLevel,
      startConversation,
      sendTextMessage,
      t,
    ]
  )

  return <ElevenLabsSupportContext.Provider value={value}>{children}</ElevenLabsSupportContext.Provider>
}

export function ElevenLabsSupportPage() {
  const support = useElevenLabsSupport()
  const { t } = useTranslation('common')

  return (
    <div className="flex h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] min-h-[400px] flex-col overflow-hidden sm:h-[calc(100dvh-5.5rem)] sm:max-h-[calc(100dvh-5.5rem)]">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-card)] shadow-[0_22px_70px_-48px_rgba(15,23,42,0.7)]">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-card)]/95 p-3 backdrop-blur sm:p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary-accent/25 bg-primary-accent/15 text-primary-accent shadow-[0_14px_34px_-22px_rgba(132,204,22,0.85)]">
              <Bot className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-[var(--color-text)] sm:text-lg">
                {t('aiSupportTitle', 'Edmission.uz Support')}
              </h1>
              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-muted)]">
                  <span className={cn('h-1.5 w-1.5 rounded-full', support.isConnected ? 'bg-primary-accent' : support.isConnecting ? 'bg-amber-400' : 'bg-[var(--color-text-muted)]/55')} />
                  {support.isConnected
                    ? (support.isSpeaking ? t('aiSupportSpeaking', 'Speaking') : t('aiSupportListening', 'Listening'))
                    : support.isConnecting ? t('aiSupportConnecting', 'Connecting') : t('aiSupportReady', 'Ready')}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-muted)]">
                  <Languages className="h-3 w-3" aria-hidden />
                  {support.agentLanguageLabel}
                </span>
              </div>
            </div>
          </div>

          {support.hasStarted && (
            <div className="flex shrink-0 items-center gap-2">
              <IconButton
                label={support.isMuted ? 'Turn microphone on' : 'Turn microphone off'}
                disabled={!support.isConnected}
                onClick={support.toggleMute}
              >
                {support.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </IconButton>
              <IconButton label="End call" danger onClick={support.endConversation}>
                {support.isConnecting ? <Loader2 className="h-5 w-5 animate-spin" /> : <PhoneOff className="h-5 w-5" />}
              </IconButton>
              <IconButton label={t('aiSupportOpenChat', 'Open chat')} active={support.chatOpen} onClick={support.openChat}>
                <MessageCircle className="h-5 w-5" />
              </IconButton>
            </div>
          )}
        </header>

        <main className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(132,204,22,0.13),transparent_42%)] p-4">
          {!support.hasStarted ? (
            <div className="flex flex-col items-center gap-5 text-center">
              <button
                type="button"
                onClick={support.startConversation}
                className="flex h-36 w-36 flex-col items-center justify-center gap-3 rounded-full border border-primary-accent/35 bg-primary-accent text-primary-dark shadow-[0_24px_58px_-20px_rgba(132,204,22,0.85)] transition-transform hover:scale-105 focus-visible:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-card)]"
                aria-label={t('aiSupportStartCall', 'Start call')}
              >
                <Phone className="h-10 w-10" aria-hidden />
                <span className="text-base font-semibold">{t('aiSupportCall', 'Call')}</span>
              </button>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/90 px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] shadow-sm">
                <Languages className="h-4 w-4 text-primary-accent" aria-hidden />
                <span>{t('aiSupportAgentLanguage', 'Agent language')}: {support.agentLanguageLabel}</span>
              </div>
            </div>
          ) : (
            <VoiceOrb
              isConnected={support.isConnected}
              isConnecting={support.isConnecting}
              isSpeaking={support.isSpeaking}
              outputLevel={support.outputLevel}
              size="large"
            />
          )}

          {support.error && (
            <div className="mt-5 max-w-md rounded-input border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-600 dark:text-red-300">
              {support.error}
            </div>
          )}
        </main>

        {support.chatOpen && (
          <ChatPanel
            messages={support.messages}
            text={support.text}
            isConnected={support.isConnected}
            inputRef={support.inputRef}
            messagesEndRef={support.messagesEndRef}
            onClose={() => support.setChatOpen(false)}
            onTextChange={support.setText}
            onSubmit={support.sendTextMessage}
          />
        )}
      </div>
    </div>
  )
}

export function ElevenLabsFloatingSupport() {
  const support = useElevenLabsSupport()
  const { role } = useAuth()
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const aiPath =
    role === 'admin' || role === 'manager' || role === 'counsellor_coordinator'
      ? '/admin/ai'
      : isUniversityLikeRole(role)
        ? '/university/ai'
        : '/ai'

  const openFullMode = () => {
    support.openChat()
    navigate(aiPath)
  }

  return (
    <div className="fixed bottom-[calc(8.5rem+env(safe-area-inset-bottom,0px))] right-4 z-30 md:bottom-6 md:right-6">
      <div
        className={cn(
          'origin-bottom-right transition-all duration-200 ease-out',
          support.hasStarted ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-90 opacity-0'
        )}
      >
        {expanded ? (
          <div className="relative flex w-[min(18rem,calc(100vw-2rem))] flex-col items-center gap-3 rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-2xl">
            <div className="absolute right-2 top-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/30 hover:text-[var(--color-text)]"
                aria-label={t('aiSupportMinimize', 'Minimize AI call')}
                title={t('aiSupportMinimize', 'Minimize AI call')}
              >
                <Minimize2 className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={openFullMode}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/30 hover:text-[var(--color-text)]"
                aria-label={t('aiSupportOpenFull', 'Open full AI chat')}
                title={t('aiSupportOpenFull', 'Open full AI chat')}
              >
                <Maximize2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <VoiceOrb
              isConnected={support.isConnected}
              isConnecting={support.isConnecting}
              isSpeaking={support.isSpeaking}
              outputLevel={support.outputLevel}
              size="small"
            />
            <p className="text-center text-xs font-medium text-[var(--color-text-muted)]">
              {support.isSpeaking
                ? t('aiSupportSpeaking', 'Speaking')
                : support.isConnected ? t('aiSupportListening', 'Listening') : t('aiSupportConnecting', 'Connecting')}
            </p>
            <p className="text-center text-[11px] font-medium text-[var(--color-text-muted)]">
              {support.agentLanguageLabel}
            </p>
            {support.error && <p className="max-w-full text-center text-xs text-red-500">{support.error}</p>}
            <div className="flex items-center gap-2">
              <IconButton
                label={support.isMuted ? t('aiSupportMicOn', 'Turn microphone on') : t('aiSupportMicOff', 'Turn microphone off')}
                disabled={!support.isConnected}
                onClick={support.toggleMute}
              >
                {support.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </IconButton>
              <IconButton label={t('aiSupportEndCall', 'End call')} danger onClick={support.endConversation}>
                {support.isConnecting ? <Loader2 className="h-5 w-5 animate-spin" /> : <PhoneOff className="h-5 w-5" />}
              </IconButton>
              <IconButton label={t('aiSupportOpenChat', 'Open chat')} active={support.chatOpen} onClick={openFullMode}>
                <MessageCircle className="h-5 w-5" />
              </IconButton>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] p-2 shadow-2xl">
            <IconButton
              label={support.isMuted ? t('aiSupportMicOn', 'Turn microphone on') : t('aiSupportMicOff', 'Turn microphone off')}
              disabled={!support.isConnected}
              onClick={support.toggleMute}
            >
              {support.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </IconButton>
            <IconButton label={t('aiSupportEndCall', 'End call')} danger onClick={support.endConversation}>
              {support.isConnecting ? <Loader2 className="h-5 w-5 animate-spin" /> : <PhoneOff className="h-5 w-5" />}
            </IconButton>
            <IconButton label={t('aiSupportExpand', 'Expand AI call')} onClick={() => setExpanded(true)}>
              <Maximize2 className="h-5 w-5" />
            </IconButton>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={support.startConversation}
        data-onboarding="floating-ai"
        className={cn(
          'absolute bottom-0 right-0 flex h-14 w-14 items-center justify-center rounded-full bg-primary-accent text-primary-dark shadow-lg transition-all duration-200 ease-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-2',
          support.hasStarted ? 'pointer-events-none scale-90 opacity-0' : 'pointer-events-auto scale-100 opacity-100'
        )}
        aria-label={t('aiSupportStartSupportCall', 'Start Edmission support call')}
      >
        <Phone className="h-6 w-6" aria-hidden />
      </button>
    </div>
  )
}

function ChatPanel({
  messages,
  text,
  isConnected,
  inputRef,
  messagesEndRef,
  onClose,
  onTextChange,
  onSubmit,
}: {
  messages: TranscriptMessage[]
  text: string
  isConnected: boolean
  inputRef: RefObject<HTMLTextAreaElement>
  messagesEndRef: RefObject<HTMLDivElement>
  onClose: () => void
  onTextChange: (value: string) => void
  onSubmit: () => void
}) {
  const { t } = useTranslation('common')

  return (
    <aside className="absolute inset-y-0 right-0 z-10 flex w-full max-w-xl flex-col border-l border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl sm:w-[28rem]">
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <p className="text-sm font-semibold text-[var(--color-text)]">{t('aiSupportChat', 'Chat')}</p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/30 hover:text-[var(--color-text)]"
          aria-label={t('aiSupportCloseChat', 'Close chat')}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[12rem] items-center justify-center text-center text-sm text-[var(--color-text-muted)]">
            {t('aiSupportEmptyChat', 'Chat messages will appear here.')}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <div key={message.id} className={cn('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                {message.role === 'agent' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-accent/15 text-primary-accent">
                    <Bot className="h-4 w-4" aria-hidden />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[85%] rounded-card px-4 py-3 text-sm leading-6',
                    message.role === 'user'
                      ? 'bg-primary-accent text-primary-dark'
                      : 'bg-[var(--color-border)]/25 text-[var(--color-text)]'
                  )}
                >
                  {message.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
        className="shrink-0 border-t border-[var(--color-border)] p-3"
      >
        <div className="flex gap-2 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 transition-all focus-within:border-primary-accent focus-within:ring-2 focus-within:ring-primary-accent focus-within:ring-offset-2 focus-within:ring-offset-[var(--color-card)]">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                onSubmit()
              }
            }}
            placeholder={isConnected ? t('aiSupportMessagePlaceholder', 'Message Edmission support...') : t('aiSupportStartToType', 'Start the call to type')}
            rows={1}
            disabled={!isConnected}
            className="min-h-[36px] max-h-28 flex-1 resize-none bg-transparent py-1.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!isConnected || !text.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-accent text-primary-dark transition-colors hover:bg-primary-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={t('aiSupportSendMessage', 'Send message')}
          >
            <Send className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </form>
    </aside>
  )
}

function VoiceOrb({
  isConnected,
  isConnecting,
  isSpeaking,
  outputLevel,
  size,
}: {
  isConnected: boolean
  isConnecting: boolean
  isSpeaking: boolean
  outputLevel: number
  size: 'large' | 'small'
}) {
  const level = Math.max(0.12, Math.min(1, outputLevel || (isSpeaking ? 0.48 : 0.16)))
  const dimension = size === 'large' ? 'h-44 w-44 sm:h-56 sm:w-56' : 'h-24 w-24'
  const barBase = size === 'large' ? 34 : 18

  return (
    <div className={cn('ai-support-orb relative flex items-center justify-center rounded-full', dimension)}>
      <span className={cn('ai-support-wave', isSpeaking && 'is-active')} />
      <span className={cn('ai-support-wave ai-support-wave-delay-1', isSpeaking && 'is-active')} />
      <span className={cn('ai-support-wave ai-support-wave-delay-2', isSpeaking && 'is-active')} />
      <div
        className={cn(
          'relative z-10 flex h-[64%] w-[64%] items-center justify-center rounded-full border border-primary-accent/30 bg-primary-accent/15 text-primary-accent shadow-[0_18px_50px_-28px_rgba(132,204,22,0.85)]',
          isConnecting && 'animate-pulse'
        )}
      >
        {isConnecting ? (
          <Loader2 className={cn(size === 'large' ? 'h-10 w-10' : 'h-6 w-6', 'animate-spin')} aria-hidden />
        ) : isConnected ? (
          <div className={cn('flex items-center justify-center gap-1.5', size === 'large' ? 'h-16' : 'h-10')} aria-hidden>
            {[0.55, 0.85, 1.2, 0.95, 0.65].map((multiplier, index) => (
              <span
                key={index}
                className={cn('ai-support-frequency-bar w-2 rounded-full bg-primary-accent', isSpeaking && 'is-active')}
                style={{
                  height: `${Math.max(8, barBase * level * multiplier)}px`,
                  animationDelay: `${index * 90}ms`,
                }}
              />
            ))}
          </div>
        ) : (
          <Phone className={cn(size === 'large' ? 'h-10 w-10' : 'h-6 w-6')} aria-hidden />
        )}
      </div>
    </div>
  )
}

function IconButton({
  label,
  active,
  danger,
  disabled,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  danger?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-45',
        danger
          ? 'border-red-500 bg-red-500 text-white hover:bg-red-600'
          : active
            ? 'border-primary-accent bg-primary-accent/15 text-primary-accent'
            : 'border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-border)]/30'
      )}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
}
