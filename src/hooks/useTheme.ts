import { useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'

export function useTheme() {
  const { theme, hasThemePreference, setTheme, toggleTheme, setHasThemePreference } = useUIStore()

  useEffect(() => {
    if (hasThemePreference) return
    setTheme('light')
    // Remove explicit preference flag set by setTheme above.
    setHasThemePreference(false)
  }, [hasThemePreference, setHasThemePreference, setTheme])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  return { theme, setTheme, toggleTheme }
}
