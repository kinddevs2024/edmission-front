import { useUIStore } from '@/store/uiStore'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/utils/cn'

export function ThemeSwitch() {
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const isDark = theme === 'dark'

  return (
    <div className="flex rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] p-0.5" role="group" aria-label="Theme">
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          !isDark ? 'bg-primary-accent text-primary-dark' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
        )}
        aria-label="Light theme"
        aria-pressed={!isDark}
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          isDark ? 'bg-primary-accent text-primary-dark' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
        )}
        aria-label="Dark theme"
        aria-pressed={isDark}
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  )
}
