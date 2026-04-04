import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import type { ChatMessage } from '@/store/aiChatStore'

/** Uses global streaming id so the full page still shows the placeholder after leaving the drawer mid-stream. */
export function isAssistantAwaitingFirstChunk(
  m: ChatMessage,
  streamingAssistantId: string | null
): boolean {
  return (
    m.role === 'assistant' &&
    streamingAssistantId === m.id &&
    !m.text &&
    !(m.thinking != null && m.thinking.length > 0)
  )
}

/** Shown inside the assistant bubble until the first streamed token (or thinking) arrives. */
export function AIStreamingPlaceholder({ className }: { className?: string }) {
  const { t } = useTranslation('common')

  return (
    <div
      className={cn('flex flex-col gap-2.5 py-0.5', className)}
      role="status"
      aria-live="polite"
      aria-label={t('aiWorking')}
    >
      <div className="flex gap-1.5 items-center" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block w-2 h-2 rounded-full bg-primary-accent"
            animate={{ y: [0, -6, 0], opacity: [0.35, 1, 0.35] }}
            transition={{
              duration: 0.75,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.16,
            }}
          />
        ))}
      </div>
      <div className="relative h-1 w-full max-w-[min(240px,100%)] rounded-full bg-[var(--color-border)]/45 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 w-[28%] rounded-full bg-primary-accent/90"
          initial={false}
          animate={{ left: ['-28%', '100%'] }}
          transition={{ duration: 1.65, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </div>
  )
}
