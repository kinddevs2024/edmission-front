import { APP_VERSION } from '@/version'

export function VersionBadge() {
  return (
    <div
      className="fixed bottom-2 right-2 flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)] opacity-60 hover:opacity-80 transition-opacity select-none pointer-events-none"
      aria-hidden
    >
      <span className="px-1.5 py-0.5 rounded bg-primary-accent/20 text-primary-accent font-medium">New</span>
      <span>v{APP_VERSION}</span>
    </div>
  )
}
