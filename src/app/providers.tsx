import { type ReactNode, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { I18nextProvider } from 'react-i18next'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider as MTThemeProvider } from '@material-tailwind/react'
import i18n from '@/i18n'
import { useTheme } from '@/hooks/useTheme'
import { checkBackendHealthOnce } from '@/services/health'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 min
      gcTime: 5 * 60 * 1000, // 5 min (formerly cacheTime)
    },
  },
})

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
        {children}
        <Toaster richColors position="top-center" />
      </BrowserRouter>
      </MTThemeProvider>
    </I18nextProvider>
    </QueryClientProvider>
  )
}
