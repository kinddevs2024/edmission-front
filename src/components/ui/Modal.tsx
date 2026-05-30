import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  panelClassName?: string
  contentClassName?: string
  footerClassName?: string
}

export function Modal({ open, onClose, title, children, footer, panelClassName, contentClassName, footerClassName }: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const timer = window.setTimeout(() => {
      const panel = panelRef.current
      if (!panel) return
      if (document.activeElement instanceof HTMLElement && panel.contains(document.activeElement)) return
      const footerElement = panel.querySelector<HTMLElement>('[data-modal-footer]')
      const focusableFooterItems = footerElement
        ? Array.from(
            footerElement.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          ).filter((node) => !node.hasAttribute('disabled') && node.getAttribute('aria-disabled') !== 'true')
        : []
      const target = focusableFooterItems.at(-1) ?? panel
      target.focus({ preventScroll: true })
    }, 0)

    return () => {
      window.clearTimeout(timer)
      previousFocusRef.current?.focus?.({ preventScroll: true })
      previousFocusRef.current = null
    }
  }, [open])

  if (!open) return null

  const getFocusableElements = () => {
    const panel = panelRef.current
    if (!panel) return []
    return Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((node) => !node.hasAttribute('disabled') && node.getAttribute('aria-disabled') !== 'true')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const focusable = getFocusableElements()
    if (focusable.length === 0) {
      event.preventDefault()
      panelRef.current?.focus({ preventScroll: true })
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement
    if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus({ preventScroll: true })
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus({ preventScroll: true })
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        className={cn(
          'relative rounded-card bg-[var(--color-card)] border max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col animate-modal-enter',
          'border-[var(--color-border)]',
          'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_12px_24px_-8px_rgba(15,23,42,0.15),0_4px_8px_-4px_rgba(15,23,42,0.08)]',
          panelClassName
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {title != null && (
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            {typeof title === 'string' ? (
              <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>
            ) : (
              <div id="modal-title" className="flex items-center justify-between gap-4">
                {title}
              </div>
            )}
          </div>
        )}
        <div className={cn('px-4 py-3 overflow-y-auto flex-1', contentClassName)}>{children}</div>
        {footer !== undefined && (
          <div data-modal-footer className={cn('px-4 py-3 border-t border-[var(--color-border)] flex justify-end gap-2', footerClassName)}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
