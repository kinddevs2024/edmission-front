import { useTranslation } from 'react-i18next'
import { useUIStore } from '@/store/uiStore'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/utils/cn'

/** One tap toggles light ↔ dark; icons crossfade with a small rotation. */
export function ThemeSwitch() {
  const { t } = useTranslation('common')
  const theme = useUIStore((s) => s.theme)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={() => toggleTheme()}
      className={cn(
        'relative h-10 w-10 shrink-0 overflow-hidden rounded-input border border-[var(--color-border)] bg-[var(--color-bg)]',
        'flex items-center justify-center',
        'transition-[background-color,box-shadow,transform] duration-200',
        'hover:border-primary-accent/35 hover:bg-[var(--color-border)]/15 hover:shadow-[0_0_0_1px_var(--color-primary-accent)]/10',
        'active:scale-[0.94]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-card)]'
      )}
      aria-label={t('themeToggle')}
      aria-pressed={isDark}
      title={t('themeToggle')}
    >
      <Sun
        className={cn(
          'absolute h-[1.125rem] w-[1.125rem] transition-all duration-300 ease-out',
          isDark
            ? 'scale-50 rotate-90 opacity-0'
            : 'scale-100 rotate-0 opacity-100 text-amber-500 dark:text-amber-400'
        )}
        strokeWidth={2.25}
        aria-hidden
      />
      <Moon
        className={cn(
          'absolute h-[1.125rem] w-[1.125rem] transition-all duration-300 ease-out',
          isDark
            ? 'scale-100 rotate-0 opacity-100 text-sky-400'
            : 'scale-50 -rotate-90 opacity-0'
        )}
        strokeWidth={2.25}
        aria-hidden
      />
    </button>
  )
}
