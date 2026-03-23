/** Must match redirect URI registered in Yandex OAuth app and backend validation. */
export const YANDEX_OAUTH_CALLBACK_PATH = '/auth/yandex/callback'

const YANDEX_AUTHORIZE = 'https://oauth.yandex.ru/authorize'
/** Space-separated scopes: email + profile name */
const YANDEX_SCOPE = 'login:email login:info'

export type YandexOAuthFlow = 'login' | 'register'

export type YandexOAuthStatePayload = {
  role: 'student' | 'university'
  acceptTerms: boolean
  flow: YandexOAuthFlow
  t: number
}

export function getYandexRedirectUri(): string {
  return `${window.location.origin}${YANDEX_OAUTH_CALLBACK_PATH}`
}

/** Base64url JSON state for Yandex `state` param (max 1024 chars on Yandex side). */
export function encodeYandexOAuthState(payload: Omit<YandexOAuthStatePayload, 't'>): string {
  const full: YandexOAuthStatePayload = { ...payload, t: Date.now() }
  const json = JSON.stringify(full)
  const base64 = btoa(json)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeYandexOAuthState(encoded: string): YandexOAuthStatePayload | null {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4))
    const json = atob(base64 + pad)
    const o = JSON.parse(json) as Partial<YandexOAuthStatePayload>
    if (o.role !== 'student' && o.role !== 'university') return null
    if (o.flow !== 'login' && o.flow !== 'register') return null
    if (typeof o.t !== 'number' || Date.now() - o.t > 15 * 60 * 1000) return null
    return {
      role: o.role,
      acceptTerms: Boolean(o.acceptTerms),
      flow: o.flow,
      t: o.t,
    }
  } catch {
    return null
  }
}

export function buildYandexAuthorizeUrl(
  clientId: string,
  statePayload: Omit<YandexOAuthStatePayload, 't'>
): string {
  const state = encodeYandexOAuthState(statePayload)
  const redirectUri = encodeURIComponent(getYandexRedirectUri())
  const scope = encodeURIComponent(YANDEX_SCOPE)
  return `${YANDEX_AUTHORIZE}?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${redirectUri}&scope=${scope}&state=${encodeURIComponent(state)}`
}

/** Вспомогательная страница Passport SDK (`public/suggest/token.html`). */
export const YANDEX_SUGGEST_TOKEN_PATH = '/suggest/token.html'

export function getYandexSuggestRedirectUri(): string {
  const custom = import.meta.env.VITE_YANDEX_SUGGEST_REDIRECT_URI?.trim()
  if (custom) return custom
  return `${window.location.origin}${YANDEX_SUGGEST_TOKEN_PATH}`
}

/** Ответ `handler()` после успешной авторизации в YaAuthSuggest. */
export function extractYandexSdkAccessToken(data: unknown): string | null {
  if (data == null) return null
  if (typeof data === 'string') {
    try {
      const p = JSON.parse(data) as { access_token?: string }
      return typeof p.access_token === 'string' ? p.access_token : null
    } catch {
      return null
    }
  }
  if (typeof data === 'object' && 'access_token' in (data as object)) {
    const t = (data as { access_token: unknown }).access_token
    return typeof t === 'string' ? t : null
  }
  return null
}

let yandexSuggestScriptPromise: Promise<void> | null = null

export function loadYandexSuggestSdkScript(): Promise<void> {
  if (typeof window !== 'undefined' && window.YaAuthSuggest) {
    return Promise.resolve()
  }
  if (yandexSuggestScriptPromise) return yandexSuggestScriptPromise
  yandexSuggestScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-yandex-passport-sdk="suggest"]'
    )
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Yandex SDK load failed')), { once: true })
      return
    }
    const s = document.createElement('script')
    s.src = 'https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-with-polyfills-latest.js'
    s.async = true
    s.dataset.yandexPassportSdk = 'suggest'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Yandex SDK load failed'))
    document.head.appendChild(s)
  })
  return yandexSuggestScriptPromise
}
