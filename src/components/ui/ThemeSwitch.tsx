import { useUIStore } from '@/store/uiStore'
import { Switch } from '@material-tailwind/react'

export function ThemeSwitch() {
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const isDark = theme === 'dark'

  return (
    // @ts-expect-error MT Switch extends DOM input and requires extra optional props
    <Switch
      checked={isDark}
      onChange={() => setTheme(isDark ? 'light' : 'dark')}
      color={'green' as const}
      className="h-6 w-11"
      containerProps={{ className: 'h-6 w-11' }}
      circleProps={{ className: 'h-5 w-5 before:opacity-0' }}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    />
  )
}
