import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '@/store/uiStore'
import {
  type YandexOAuthFlow,
  buildYandexAuthorizeUrl,
  extractYandexSdkAccessToken,
  getYandexSuggestRedirectUri,
  loadYandexSuggestSdkScript,
} from '@/utils/yandexOAuth'
import { loginWithYandexAccessToken } from '@/services/auth'
import { getApiError } from '@/services/api'
import { getApiErrorKey } from '@/utils/apiErrorI18n'
import { cn } from '@/utils/cn'

export type YandexSignInButtonProps = {
  disabled?: boolean
  /** Omit on login — backend uses role from DB. Required on registration. */
  role?: 'student' | 'university'
  acceptTerms: boolean
  flow: YandexOAuthFlow
  className?: string
  compact?: boolean
  forceFallback?: boolean
  logoUrl?: string
  title?: string
  onSuccess: () => void | Promise<void>
  onError: (message: string) => void
  onBusyChange?: (busy: boolean) => void
}

/**
 * Официальная кнопка Яндекс ID через Passport SDK (`sdk-suggest-with-polyfills-latest.js`).
 * Нужны `VITE_YANDEX_CLIENT_ID` и Redirect URI `{origin}/suggest/token.html` в кабинете OAuth.
 */
export function YandexSignInButton({
  disabled,
  role,
  acceptTerms,
  flow,
  className,
  compact = false,
  forceFallback = false,
  logoUrl,
  title,
  onSuccess,
  onError,
  onBusyChange,
}: YandexSignInButtonProps) {
  const { t, i18n } = useTranslation(['auth', 'errors'])
  const uiTheme = useUIStore((s) => s.theme)
  const clientId = import.meta.env.VITE_YANDEX_CLIENT_ID?.trim()
  const [fallbackMode, setFallbackMode] = useState(Boolean(forceFallback))

  const containerRef = useRef<HTMLDivElement>(null)
  const parentIdRef = useRef(`yandex-passport-btn-${Math.random().toString(36).slice(2, 12)}`)

  const roleRef = useRef(role)
  const acceptTermsRef = useRef(acceptTerms)
  const flowRef = useRef(flow)
  roleRef.current = role
  acceptTermsRef.current = acceptTerms
  flowRef.current = flow

  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  const onBusyChangeRef = useRef(onBusyChange)
  onSuccessRef.current = onSuccess
  onErrorRef.current = onError
  onBusyChangeRef.current = onBusyChange

  useEffect(() => {
    if (forceFallback) {
      setFallbackMode(true)
    }
  }, [forceFallback])

  useEffect(() => {
    if (!clientId || disabled || fallbackMode) return
    const parentId = parentIdRef.current
    const el = containerRef.current
    if (!el) return
    el.id = parentId

    let cancelled = false

    void (async () => {
      try {
        await loadYandexSuggestSdkScript()
        if (cancelled || !window.YaAuthSuggest) return

        const htmlIsDark = document.documentElement.classList.contains('dark')
        const buttonTheme = uiTheme === 'dark' || htmlIsDark ? 'dark' : 'light'
        const buttonIcon = i18n.language.startsWith('en') ? 'yaEng' : 'ya'

        const initResult = await window.YaAuthSuggest.init(
          {
            client_id: clientId,
            response_type: 'token',
            redirect_uri: getYandexSuggestRedirectUri(),
          },
          window.location.origin,
          {
            view: 'button',
            parentId,
            buttonSize: compact ? 's' : 'm',
            buttonView: compact ? 'icon' : 'main',
            buttonTheme,
            buttonBorderRadius: compact ? 22 : 0,
            buttonIcon,
          }
        )

        if (cancelled) return
        if (initResult.status !== 'ok' || typeof initResult.handler !== 'function') {
          setFallbackMode(true)
          return
        }

        void initResult
          .handler()
          .then(async (data) => {
            if (cancelled) return
            const accessToken = extractYandexSdkAccessToken(data)
            if (!accessToken) {
              onErrorRef.current(t('auth:yandexTokenMissing', 'Could not read Yandex token'))
              return
            }
            const f = flowRef.current
            const terms = f === 'login' ? true : acceptTermsRef.current
            if (f === 'register' && !terms) {
              onErrorRef.current(t('auth:acceptTermsRequired'))
              return
            }
            onBusyChangeRef.current?.(true)
            try {
              const r = roleRef.current
              await loginWithYandexAccessToken({
                accessToken,
                ...(r != null ? { role: r } : {}),
                acceptTerms: terms,
              })
              if (!cancelled) await onSuccessRef.current()
            } catch (err) {
              if (!cancelled) {
                const apiErr = getApiError(err)
                const errList = apiErr.errors as Array<{ message?: string }> | undefined
                const firstMsg = Array.isArray(errList) && errList[0]?.message ? errList[0].message : null
                onErrorRef.current(
                  firstMsg ?? apiErr.message ?? t(`errors:${getApiErrorKey(err)}`)
                )
              }
            } finally {
              if (!cancelled) onBusyChangeRef.current?.(false)
            }
          })
          .catch((err: unknown) => {
            if (cancelled) return
            const msg = err instanceof Error ? err.message : String(err)
            onErrorRef.current(msg || t('errors:unknown'))
          })
      } catch (e) {
        if (!cancelled) {
          setFallbackMode(true)
        }
      }
    })()

    return () => {
      cancelled = true
      el.innerHTML = ''
    }
  }, [clientId, disabled, fallbackMode, uiTheme, i18n.language, t])

  if (!clientId) return null

  const handleFallbackClick = () => {
    if (disabled) return
    const f = flowRef.current
    const terms = f === 'login' ? true : acceptTermsRef.current
    if (f === 'register' && !terms) {
      onErrorRef.current(t('auth:acceptTermsRequired'))
      return
    }
    const selectedRole = roleRef.current ?? 'student'
    window.location.href = buildYandexAuthorizeUrl(clientId, {
      role: selectedRole,
      acceptTerms: terms,
      flow: f,
    })
  }

  if (fallbackMode) {
    return (
      <button
        type="button"
        onClick={handleFallbackClick}
        disabled={disabled}
        title={title}
        className={cn(
          compact
            ? 'mx-auto inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-0'
            : 'mx-auto flex h-12 w-full max-w-[384px] items-center rounded-[10px] bg-black px-2.5 py-2',
          compact ? '' : 'shadow-[0_1px_2px_rgba(0,0,0,0.25)] ring-1 ring-black/80',
          'transition-[opacity,transform] duration-150',
          disabled ? 'cursor-not-allowed opacity-50 pointer-events-none' : 'hover:opacity-95 active:scale-[0.99]',
          className
        )}
      >
        {compact ? (
          logoUrl ? (
            <img src={logoUrl} alt="" className="h-5 w-5 object-contain" />
          ) : (
            <span className="text-[17px] font-bold leading-none text-[#FC3F1D] translate-y-px">�</span>
          )
        ) : (
          <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FC3F1D]" aria-hidden>
              {logoUrl ? (
                <img src={logoUrl} alt="" className="h-6 w-6 object-contain" />
              ) : (
                <span className="text-[17px] font-bold leading-none text-white translate-y-px">�</span>
              )}
            </span>
            <span className="min-w-0 flex-1 px-2 text-center text-[15px] font-medium leading-tight text-white">
              {flowRef.current === 'register' ? t('registerWithYandexId') : t('signInWithYandexId')}
            </span>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#404040]"
              aria-hidden
            >
              <span className="h-4 w-4 rounded-full bg-white/95" />
            </span>
          </>
        )}
      </button>
    )
  }

  return (
    <div
      title={title}
      className={cn(
        compact
          ? 'mx-auto h-11 w-11 min-h-[44px] min-w-[44px] flex items-center justify-center overflow-hidden rounded-full'
          : 'mx-auto w-full max-w-[384px] min-h-[44px] flex items-center justify-center',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
    >
      <div
        ref={containerRef}
        className={cn(
          'w-full flex items-center justify-center [&_iframe]:max-w-full',
          compact &&
            '[&_.yaPreloadingSuggestBlockContainer]:!m-0 [&_.yaPreloadingSuggestBlockContainer]:!flex [&_.yaPreloadingSuggestBlockContainer]:!h-11 [&_.yaPreloadingSuggestBlockContainer]:!w-11 [&_.yaPreloadingSuggestBlockContainer]:!items-center [&_.yaPreloadingSuggestBlockContainer]:!justify-center [&_.yaPersonalButton]:!h-11 [&_.yaPersonalButton]:!w-11 [&_.yaPersonalButton]:!min-h-[44px] [&_.yaPersonalButton]:!min-w-[44px] [&_.yaPersonalButtonLogo]:!h-5 [&_.yaPersonalButtonLogo]:!w-5'
        )}
      />
    </div>
  )
}


