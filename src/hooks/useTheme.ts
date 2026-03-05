import { useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'

export function useTheme() {
  const { theme, hasThemePreference, setTheme, toggleTheme, setHasThemePreference } = useUIStore()

  useEffect(() => {
    if (hasThemePreference) return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    setTheme(media.matches ? 'dark' : 'light')
    // Remove explicit preference flag set by setTheme above:
    setHasThemePreference(false)

    const onChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light')
      setHasThemePreference(false)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [hasThemePreference, setHasThemePreference, setTheme])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  return { theme, setTheme, toggleTheme }
}
