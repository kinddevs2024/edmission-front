import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '@/store/uiStore'
import {
  type YandexOAuthFlow,
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
  onSuccess,
  onError,
  onBusyChange,
}: YandexSignInButtonProps) {
  const { t, i18n } = useTranslation(['auth', 'errors'])
  const uiTheme = useUIStore((s) => s.theme)
  const clientId = import.meta.env.VITE_YANDEX_CLIENT_ID?.trim()

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
    if (!clientId || disabled) return
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
            buttonSize: 'm',
            buttonView: 'main',
            buttonTheme,
            buttonBorderRadius: 0,
            buttonIcon,
          }
        )

        if (cancelled) return
        if (initResult.status !== 'ok' || typeof initResult.handler !== 'function') {
          const code = 'code' in initResult ? String((initResult as { code?: string }).code || '') : ''
          onErrorRef.current(code || t('auth:yandexSdkInitError', 'Could not initialize Yandex sign-in'))
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
          onErrorRef.current(e instanceof Error ? e.message : t('auth:yandexSdkInitError'))
        }
      }
    })()

    return () => {
      cancelled = true
      el.innerHTML = ''
    }
  }, [clientId, disabled, uiTheme, i18n.language, t])

  if (!clientId) return null

  return (
    <div
      className={cn(
        'w-full max-w-[384px] mx-auto min-h-[44px] flex items-center justify-center',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
    >
      <div ref={containerRef} className="w-full flex justify-center [&_iframe]:max-w-full" />
    </div>
  )
}
