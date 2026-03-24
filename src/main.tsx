import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initI18n } from '@/i18n'
import { Providers } from '@/app/providers'
import { App } from '@/app/App'
import '@/styles/index.css'
import { useAuthStore } from '@/store/authStore'
import { loadAuth, isAuthExpired, clearAuth, updateLastActivity } from '@/services/authPersistence'
import { getProfile } from '@/services/auth'

function hydrateAuth(): boolean {
  const stored = loadAuth()
  if (!stored) return false
  if (isAuthExpired(stored.lastActivityAt)) {
    clearAuth()
    useAuthStore.getState().logout()
    return false
  }
  useAuthStore.getState().setAuth(stored.user, stored.accessToken)
  updateLastActivity()
  return true
}

initI18n().then(() => {
  const restored = hydrateAuth()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Providers>
        <App />
      </Providers>
    </StrictMode>
  )
  // Keep role/profile in sync after admin-side changes (e.g. student -> university).
  if (restored) {
    getProfile().catch(() => {
      /* handled globally by api interceptors when needed */
    })
  }
})
