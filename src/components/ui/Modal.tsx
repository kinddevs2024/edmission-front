import { type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        className="relative rounded-card bg-[var(--color-card)] border border-[var(--color-border)] shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col animate-modal-enter"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {title && (
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            <h2 id="modal-title" className="text-lg font-semibold">
              {title}
            </h2>
          </div>
        )}
        <div className="px-4 py-3 overflow-y-auto flex-1">{children}</div>
        {footer !== undefined && (
          <div className="px-4 py-3 border-t border-[var(--color-border)] flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
