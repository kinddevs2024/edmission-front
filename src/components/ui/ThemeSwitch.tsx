import { useUIStore } from '@/store/uiStore'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/utils/cn'

export function ThemeSwitch() {
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-[var(--color-border)] transition-colors focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-2',
        isDark ? 'bg-secondary' : 'bg-[var(--color-border)]/30'
      )}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={isDark}
    >
      <span
        className={cn(
          'pointer-events-none flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-card)] shadow-sm transition-all duration-200',
          isDark ? 'translate-x-8' : 'translate-x-1'
        )}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-primary-accent" aria-hidden />
        ) : (
          <Sun className="h-3.5 w-3.5 text-amber-500" aria-hidden />
        )}
      </span>
    </button>
  )
}
