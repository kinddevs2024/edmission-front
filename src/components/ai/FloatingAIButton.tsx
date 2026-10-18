import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { WebsiteAssistantPanel } from '@/components/ai/WebsiteAssistantPanel'
import { assistantWords } from '@/components/ai/assistantCopy'
import { useAuth } from '@/hooks/useAuth'

export function FloatingAIButton() {
  const { i18n } = useTranslation('common')
  const { role, user } = useAuth()
  const [open, setOpen] = useState(false)
  const launcher = useRef<HTMLButtonElement>(null)
  const locale = i18n.language.startsWith('ru') ? 'ru' : i18n.language.startsWith('uz') ? 'uz' : 'en'
  const l = assistantWords[locale]
  const close = () => { setOpen(false); launcher.current?.focus() }
  useEffect(() => {
    if (!open) return
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); launcher.current?.focus() } }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [open])
  if (!user || role === 'admin' || role === 'student_admin' || role === 'manager' || role === 'counsellor_coordinator') return null
  return <div className="fixed bottom-[calc(8.5rem+env(safe-area-inset-bottom,0px))] right-4 z-30 [@media(max-height:600px)]:bottom-3 md:bottom-6 md:right-6">
    <section id="website-ai-panel" role="dialog" aria-label={l.title} hidden={!open} className="absolute bottom-[4.25rem] right-0 h-[min(36rem,calc(100dvh-14rem))] w-[min(25rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl md:h-[min(36rem,calc(100dvh-7rem))] [@media(max-height:600px)]:h-[calc(100dvh-7rem)]">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] px-3"><div className="flex min-w-0 items-center gap-2"><img src="/logo/Group%201.png" alt="" className="h-8 w-8 object-contain" /><div className="min-w-0"><h2 className="truncate text-sm font-semibold text-[var(--color-text)]">{l.title}</h2><p className="truncate text-xs text-[var(--color-text-muted)]">{l.subtitle}</p></div></div><button type="button" onClick={close} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-[var(--color-border)]/30 focus:outline-none focus:ring-2 focus:ring-primary-accent" aria-label={l.close}><X className="h-4 w-4" aria-hidden /></button></div>
      <div className="h-[calc(100%_-_3.5rem)] min-h-0"><WebsiteAssistantPanel key={user.id} userId={user.id} locale={locale} open={open} /></div>
    </section>
    <button ref={launcher} type="button" onClick={() => setOpen(value => !value)} data-onboarding="floating-ai" className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-accent text-primary-dark shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-2" aria-label={open ? l.close : l.open} title={l.open} aria-expanded={open} aria-controls="website-ai-panel">{open ? <X className="h-6 w-6" aria-hidden /> : <MessageCircle className="h-6 w-6" aria-hidden />}</button>
  </div>
}
