import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initI18n } from '@/i18n'
import { Providers } from '@/app/providers'
import { App } from '@/app/App'
import '@/styles/index.css'
import { useAuthStore } from '@/store/authStore'
import { loadAuth, isAuthExpired, clearAuth, updateLastActivity } from '@/services/authPersistence'

function hydrateAuth() {
  const stored = loadAuth()
  if (!stored) return
  if (isAuthExpired(stored.lastActivityAt)) {
    clearAuth()
    useAuthStore.getState().logout()
    return
  }
  useAuthStore.getState().setAuth(stored.user, stored.accessToken)
  updateLastActivity()
}

initI18n().then(() => {
  hydrateAuth()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Providers>
        <App />
      </Providers>
    </StrictMode>
  )
})
