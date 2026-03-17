import { type ReactNode } from 'react'
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
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        className={cn(
          'relative rounded-card bg-[var(--color-card)] border border-[var(--color-border)] shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col animate-modal-enter',
          panelClassName
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
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
          <div className={cn('px-4 py-3 border-t border-[var(--color-border)] flex justify-end gap-2', footerClassName)}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
