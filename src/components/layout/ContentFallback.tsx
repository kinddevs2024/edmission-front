/** Minimal fallback for content area while lazy page loads. Layout (sidebar, header) stays visible. */
export function ContentFallback() {
  return (
    <div className="min-h-[200px] flex items-center justify-center" aria-hidden>
      <div className="w-6 h-6 border-2 border-[var(--color-primary-accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
