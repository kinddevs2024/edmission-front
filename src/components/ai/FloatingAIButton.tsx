import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ChatView } from '@/components/chat/ChatView'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'

const CONSULTANT_LOGO = '/logo/Group%201.png'

export function FloatingAIButton() {
  const { t } = useTranslation('common')
  const { role } = useAuth()
  const [open, setOpen] = useState(false)

  if (role === 'admin' || role === 'student_admin' || role === 'manager' || role === 'counsellor_coordinator') {
    return null
  }

  return (
    <div className="fixed bottom-[calc(8.5rem+env(safe-area-inset-bottom,0px))] right-4 z-30 md:bottom-6 md:right-6">
      <div
        className={cn(
          'mb-3 flex h-[min(34rem,calc(100dvh-8rem))] w-[min(23rem,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl transition-all duration-200',
          open ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        )}
        aria-hidden={!open}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <img src={CONSULTANT_LOGO} alt="" className="h-8 w-8 shrink-0 rounded-full object-contain" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                {t('supportConsultant', 'Support consultant')}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {t('consultingChat', 'Consulting chat')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/30 hover:text-[var(--color-text)]"
            aria-label={t('close', 'Close')}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {open ? <ChatView supportOnly autoOpenSupport compact /> : null}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        data-onboarding="floating-ai"
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-accent text-primary-dark shadow-lg transition-all duration-200 ease-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-2"
        aria-label={t('openConsultingChat', 'Open consulting chat')}
        title={t('openConsultingChat', 'Open consulting chat')}
      >
        {open ? <X className="h-6 w-6" aria-hidden /> : <MessageCircle className="h-6 w-6" aria-hidden />}
      </button>
    </div>
  )
}
