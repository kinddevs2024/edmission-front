import { type ReactNode, useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { I18nextProvider } from 'react-i18next'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider as MTThemeProvider } from '@material-tailwind/react'
import i18n from '@/i18n'
import { useTheme } from '@/hooks/useTheme'
import { checkBackendHealthOnce } from '@/services/health'
import { GlobalOfferCelebration } from '@/components/documents/GlobalOfferCelebration'
import { queryClient } from './queryClient'

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
    <QueryClientProvider client={queryClient}>
    <I18nextProvider i18n={i18n}>
      <MTThemeProvider>
      <BrowserRouter>
        <BackendHealthCheck />
        <ThemeSync />
        <GlobalOfferCelebration />
        {children}
        <Toaster
          richColors
          position="top-right"
          expand
          closeButton
          toastOptions={{
            className:
              'rounded-card border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] shadow-[var(--shadow-card)]',
          }}
        />
      </BrowserRouter>
      </MTThemeProvider>
    </I18nextProvider>
    </QueryClientProvider>
  )
}
