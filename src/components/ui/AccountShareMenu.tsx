import { useEffect, useId, useRef, useState } from 'react'
import { MoreVertical, Share2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'

type AccountShareMenuProps = {
  onShare: () => void | Promise<void>
  className?: string
}

export function AccountShareMenu({ onShare, className }: AccountShareMenuProps) {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onDocMouseDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onDocKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onDocKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onDocKeyDown)
    }
  }, [open])

  const runShare = async () => {
    setRunning(true)
    try {
      await onShare()
    } finally {
      setRunning(false)
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t('moreActions', 'More actions')}
        disabled={running}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-input border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] hover:bg-[var(--color-bg-muted)] disabled:opacity-60"
      >
        <MoreVertical className="h-4 w-4" aria-hidden />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-20 mt-2 min-w-[170px] overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-1 shadow-[var(--shadow-card)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={runShare}
            disabled={running}
            className="flex w-full items-center gap-2 rounded-input px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-bg-muted)] disabled:opacity-60"
          >
            <Share2 className="h-4 w-4" aria-hidden />
            <span>{t('shareAccount', 'Share account')}</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}

