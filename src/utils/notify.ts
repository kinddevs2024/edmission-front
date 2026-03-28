import { toast } from 'sonner'

type NotifyOptions = {
  description?: string
  duration?: number
  action?: { label: string; onClick: () => void }
}

const BASE_CLASS =
  'rounded-card border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] shadow-[var(--shadow-card)]'

export function notifySuccess(message: string, options: NotifyOptions = {}): void {
  toast.success(message, {
    description: options.description,
    duration: options.duration ?? 3800,
    className: BASE_CLASS,
    action: options.action,
  })
}

export function notifyInfo(message: string, options: NotifyOptions = {}): void {
  toast(message, {
    description: options.description,
    duration: options.duration ?? 5200,
    className: BASE_CLASS,
    action: options.action,
  })
}

export function notifyError(message: string, options: NotifyOptions = {}): void {
  toast.error(message, {
    description: options.description,
    duration: options.duration ?? 5200,
    className: BASE_CLASS,
    action: options.action,
  })
}
