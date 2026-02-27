import { APP_VERSION } from '@/version'

export function VersionBadge() {
  return (
    <div
      className="fixed bottom-2 right-2 text-[10px] text-[var(--color-text-muted)] opacity-50 hover:opacity-70 transition-opacity select-none pointer-events-none"
      aria-hidden
    >
      к {APP_VERSION}
    </div>
  )
}
