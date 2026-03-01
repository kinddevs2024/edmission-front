import { useState, useEffect, useRef } from 'react'
import { Globe } from 'lucide-react'
import i18n from '@/i18n'
import { supportedLngs, type SupportedLng } from '@/i18n/config'
import { cn } from '@/utils/cn'

const LANGUAGE_LABELS: Record<SupportedLng, string> = {
  en: 'English',
  ru: 'Русский',
  uz: "O'zbek",
}

export function LanguageMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const currentLng = (i18n.language?.split('-')[0] || 'en') as SupportedLng
  const currentLabel = LANGUAGE_LABELS[currentLng] ?? currentLng.toUpperCase()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (lng: SupportedLng) => {
    i18n.changeLanguage(lng)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-input border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-border)]/20 transition-colors text-sm text-[var(--color-text)]"
        aria-label="Select language"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Globe className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" aria-hidden />
        <span className="font-medium hidden sm:inline">{currentLabel}</span>
        <svg
          className={cn('h-4 w-4 text-[var(--color-text-muted)] transition-transform', open && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 min-w-[160px] rounded-card border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg py-1 z-50 animate-modal-enter"
          role="menu"
        >
          {supportedLngs.map((lng) => (
            <button
              key={lng}
              type="button"
              role="menuitem"
              onClick={() => handleSelect(lng)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                currentLng === lng
                  ? 'bg-primary-accent/15 text-primary-accent font-medium'
                  : 'text-[var(--color-text)] hover:bg-[var(--color-border)]/20'
              )}
            >
              <span className="flex-1">{LANGUAGE_LABELS[lng]}</span>
              {currentLng === lng && (
                <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
