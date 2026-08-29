import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { getApiError } from '@/services/api'
import { loginWithGoogle } from '@/services/auth'
import { getApiErrorKey } from '@/utils/apiErrorI18n'
import { navigateAfterLogin } from '@/utils/navigateAfterAuth'
import { showOAuthPasswordReminder } from '@/utils/oauthPasswordToast'

type GoogleIdentityApi = {
  initialize: (config: {
    client_id: string
    callback: (response: { credential?: string }) => void
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
    itp_support?: boolean
  }) => void
  prompt: () => void
  cancel?: () => void
}

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
const HIDDEN_PATH_PREFIXES = [
  '/maintenance',
  '/auth/google/mobile',
  '/auth/telegram',
  '/login',
  '/register',
]

function getGoogleIdentityApi(): GoogleIdentityApi | undefined {
  const w = window as Window & {
    google?: {
      accounts?: {
        id?: GoogleIdentityApi
      }
    }
  }
  return w.google?.accounts?.id
}

function canShowOnPath(pathname: string): boolean {
  return !HIDDEN_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function GoogleOneTapPrompt() {
  const { isAuthenticated } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation(['auth', 'errors'])
  const inFlightRef = useRef(false)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()

  const shouldShowPrompt = useMemo(
    () => Boolean(clientId) && !isAuthenticated && canShowOnPath(pathname),
    [clientId, isAuthenticated, pathname]
  )

  const onCredentialRef = useRef<(credential: string) => Promise<void>>(async () => {})
  onCredentialRef.current = async (credential: string) => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    try {
      const { user } = await loginWithGoogle({
        idToken: credential,
        role: 'student',
        acceptTerms: true,
      })
      if (user.mustSetLocalPassword) {
        showOAuthPasswordReminder(t('auth:oauthPasswordToastTitle'), t('auth:oauthPasswordToastDesc'))
      }
      navigateAfterLogin(navigate, user, { replace: true })
    } catch (err) {
      const key = getApiErrorKey(err)
      const apiErr = getApiError(err)
      const message = key !== 'default' ? t(`errors:${key}`) : apiErr.message || t('errors:default')
      toast.error(message)
    } finally {
      inFlightRef.current = false
    }
  }

  useEffect(() => {
    if (!clientId || !shouldShowPrompt) return

    let cancelled = false
    let scriptWithListener: HTMLScriptElement | null = null
    let pollTimer: number | null = null
    let promptStarted = false
    const mountPrompt = () => {
      if (promptStarted) return
      const googleId = getGoogleIdentityApi()
      if (cancelled || !googleId) return
      promptStarted = true
      googleId.cancel?.()
      googleId.initialize({
        client_id: clientId,
        callback: (response) => {
          const credential = response.credential?.trim()
          if (credential) void onCredentialRef.current(credential)
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        itp_support: true,
      })
      googleId.prompt()
    }
    const onLoad = () => mountPrompt()
    const startPolling = () => {
      if (pollTimer != null) return
      pollTimer = window.setInterval(() => {
        if (cancelled) return
        mountPrompt()
      }, 100)
    }

    if (getGoogleIdentityApi()) {
      mountPrompt()
    } else {
      const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT_SRC}"]`)
      if (existingScript) {
        scriptWithListener = existingScript
        existingScript.addEventListener('load', onLoad, { once: true })
        startPolling()
      } else {
        const script = document.createElement('script')
        script.src = GOOGLE_SCRIPT_SRC
        script.async = true
        script.defer = true
        scriptWithListener = script
        script.addEventListener('load', onLoad, { once: true })
        document.head.appendChild(script)
        startPolling()
      }
    }

    return () => {
      cancelled = true
      if (pollTimer != null) {
        window.clearInterval(pollTimer)
      }
      if (scriptWithListener) {
        scriptWithListener.removeEventListener('load', onLoad)
      }
      getGoogleIdentityApi()?.cancel?.()
    }
  }, [clientId, shouldShowPrompt])

  return null
}
