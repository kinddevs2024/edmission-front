import { type ReactNode, useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import { BrowserRouter } from 'react-router-dom'
import i18n from '@/i18n'
import { useTheme } from '@/hooks/useTheme'
import { checkBackendHealthOnce } from '@/services/health'

function ThemeSync() {
  useTheme()
  return null
}

/** Один раз при первом заходе на сайт проверяет здоровье бэкенда (при переходах по страницам не проверяет). */
function BackendHealthCheck() {
  useEffect(() => {
    checkBackendHealthOnce()
  }, [])
  return null
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <BackendHealthCheck />
        <ThemeSync />
        {children}
      </BrowserRouter>
    </I18nextProvider>
  )
}
