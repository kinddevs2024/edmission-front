import { toast } from 'sonner'

const TOAST_CLASS =
  'rounded-card border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] shadow-[var(--shadow-card)]'

export function showOAuthPasswordReminder(title: string, description: string) {
  toast(title, {
    description,
    duration: 10_000,
    className: TOAST_CLASS,
  })
}
