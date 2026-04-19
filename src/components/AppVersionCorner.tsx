/** Fixed bottom-corner build version (from `package.json`, see `vite.config.ts`). */
export function AppVersionCorner() {
  return (
    <div
      className="pointer-events-none fixed bottom-2 end-2 z-[100] select-none text-[10px] font-medium tabular-nums text-[var(--color-text-muted)] opacity-60"
      aria-label={`Version ${__APP_VERSION__}`}
    >
      {__APP_VERSION__}
    </div>
  )
}
