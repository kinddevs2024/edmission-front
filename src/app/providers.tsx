import { type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { BrowserRouter } from 'react-router-dom'
import i18n from '@/i18n'
import { useTheme } from '@/hooks/useTheme'

function ThemeSync() {
  useTheme()
  return null
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <ThemeSync />
        {children}
      </BrowserRouter>
    </I18nextProvider>
  )
}
