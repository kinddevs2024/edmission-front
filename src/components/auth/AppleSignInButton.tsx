import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { loginWithApple } from '@/services/auth'
import { getApiError } from '@/services/api'
import { getApiErrorKey } from '@/utils/apiErrorI18n'
import { cn } from '@/utils/cn'

type AppleAuthResponse = {
  authorization?: {
    code?: string
    id_token?: string
    state?: string
  }
  user?: {
    name?: {
      firstName?: string
      lastName?: string
    }
    email?: string
  }
}

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string
          scope: string
          redirectURI: string
          state: string
          usePopup: boolean
        }) => void
        signIn: () => Promise<AppleAuthResponse>
      }
    }
  }
}

export type AppleSignInButtonProps = {
  disabled?: boolean
  role?: 'student' | 'university'
  acceptTerms: boolean
  flow: 'login' | 'register'
  compact?: boolean
  className?: string
  title?: string
  onSuccess: () => void | Promise<void>
  onError: (message: string) => void
  onBusyChange?: (busy: boolean) => void
}

const APPLE_SCRIPT_SRC = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js'

let appleScriptPromise: Promise<void> | null = null

function loadAppleScript(): Promise<void> {
  if (window.AppleID?.auth) return Promise.resolve()
  if (appleScriptPromise) return appleScriptPromise
  appleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${APPLE_SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Apple sign-in script failed')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = APPLE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => reject(new Error('Apple sign-in script failed')), { once: true })
    document.head.appendChild(script)
  })
  return appleScriptPromise
}

function getAppleRedirectUri(): string {
  const configured = import.meta.env.VITE_APPLE_REDIRECT_URI?.trim()
  return configured || `${window.location.origin}/auth/apple/callback`
}

function createState(): string {
  const bytes = new Uint8Array(16)
  window.crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function AppleSignInButton({
  disabled,
  role,
  acceptTerms,
  flow,
  compact = false,
  className,
  title,
  onSuccess,
  onError,
  onBusyChange,
}: AppleSignInButtonProps) {
  const { t } = useTranslation(['auth', 'errors'])
  const clientId = import.meta.env.VITE_APPLE_CLIENT_ID?.trim()
  const inFlightRef = useRef(false)

  if (!clientId) return null

  const handleClick = async () => {
    if (disabled || inFlightRef.current) return
    const terms = flow === 'login' ? true : acceptTerms
    if (flow === 'register' && !terms) {
      onError(t('auth:acceptTermsRequired'))
      return
    }
    inFlightRef.current = true
    onBusyChange?.(true)
    try {
      await loadAppleScript()
      const redirectUri = getAppleRedirectUri()
      const state = createState()
      window.AppleID?.auth.init({
        clientId,
        scope: 'name email',
        redirectURI: redirectUri,
        state,
        usePopup: true,
      })
      const response = await window.AppleID!.auth.signIn()
      const code = response.authorization?.code?.trim()
      const idToken = response.authorization?.id_token?.trim()
      const returnedState = response.authorization?.state?.trim()
      if (!code || returnedState !== state) {
        onError(t('auth:appleMissingParams', 'Apple did not return a valid authorization code. Try again.'))
        return
      }
      await loginWithApple({
        code,
        redirectUri,
        ...(idToken ? { idToken } : {}),
        ...(response.user ? { user: response.user } : {}),
        ...(role != null ? { role } : {}),
        acceptTerms: terms,
      })
      await onSuccess()
    } catch (err) {
      const apiErr = getApiError(err)
      const errList = apiErr.errors as Array<{ message?: string }> | undefined
      const firstMsg = Array.isArray(errList) && errList[0]?.message ? errList[0].message : null
      onError(firstMsg ?? apiErr.message ?? t(`errors:${getApiErrorKey(err)}`))
    } finally {
      inFlightRef.current = false
      onBusyChange?.(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={disabled}
      title={title}
      className={cn(
        compact
          ? 'inline-flex h-11 w-11 min-w-[44px] items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] p-0'
          : 'mx-auto flex h-12 w-full max-w-[384px] items-center justify-center rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-4',
        'transition-[opacity,transform] duration-150',
        disabled ? 'pointer-events-none cursor-not-allowed opacity-50' : 'hover:opacity-95 active:scale-[0.99]',
        className
      )}
      aria-label={title}
    >
      <span className="text-lg font-semibold leading-none">{compact ? 'A' : 'Apple'}</span>
    </button>
  )
}
