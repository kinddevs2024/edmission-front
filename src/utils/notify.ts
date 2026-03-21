import { toast } from 'sonner'

type NotifyOptions = {
  description?: string
  duration?: number
}

const BASE_CLASS =
  'rounded-card border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] shadow-[var(--shadow-card)]'

export function notifySuccess(message: string, options: NotifyOptions = {}): void {
  toast.success(message, {
    description: options.description,
    duration: options.duration ?? 3800,
    className: BASE_CLASS,
  })
}

export function notifyInfo(message: string, options: NotifyOptions = {}): void {
  toast(message, {
    description: options.description,
    duration: options.duration ?? 4200,
    className: BASE_CLASS,
  })
}

export function notifyError(message: string, options: NotifyOptions = {}): void {
  toast.error(message, {
    description: options.description,
    duration: options.duration ?? 5200,
    className: BASE_CLASS,
  })
}
