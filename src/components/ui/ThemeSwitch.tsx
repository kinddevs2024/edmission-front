import { useUIStore } from '@/store/uiStore'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/utils/cn'

/** Track = rounded-input (12px). Inner thumb radius = 12px - 2px padding = 10px so edges align with site. */
const TRACK_PADDING = 2
const TRACK_RADIUS_PX = 12
const THUMB_RADIUS_PX = TRACK_RADIUS_PX - TRACK_PADDING

export function ThemeSwitch() {
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const isDark = theme === 'dark'

  return (
    <div
      className="flex border border-[var(--color-border)] bg-[var(--color-bg)]"
      style={{ borderRadius: TRACK_RADIUS_PX, padding: TRACK_PADDING }}
      role="group"
      aria-label="Theme"
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={cn(
          'p-1.5 transition-colors duration-200',
          !isDark ? 'bg-primary-accent text-primary-dark' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
        )}
        style={{
          borderTopLeftRadius: THUMB_RADIUS_PX,
          borderBottomLeftRadius: THUMB_RADIUS_PX,
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
        }}
        aria-label="Light theme"
        aria-pressed={!isDark}
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={cn(
          'p-1.5 transition-colors duration-200',
          isDark ? 'bg-primary-accent text-primary-dark' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
        )}
        style={{
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          borderTopRightRadius: THUMB_RADIUS_PX,
          borderBottomRightRadius: THUMB_RADIUS_PX,
        }}
        aria-label="Dark theme"
        aria-pressed={isDark}
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  )
}
