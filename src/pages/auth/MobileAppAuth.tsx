import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { exchangeMobileWebAuthSession, getApiError } from '@/services/auth'

let exchangeCache: { token: string; promise: Promise<unknown> } | null = null

function safeNext(raw: string | null): string {
  const value = String(raw ?? '').trim()
  if (!value.startsWith('/') || value.startsWith('//')) return '/student/dashboard'
  if (value === '/login' || value.startsWith('/login?')) return '/student/dashboard'
  if (value === '/mobile-app-auth' || value.startsWith('/mobile-app-auth?')) return '/student/dashboard'
  return value
}

function postNativeAuthError(message: string): void {
  try {
    const bridge = (window as unknown as { ReactNativeWebView?: { postMessage?: (message: string) => void } }).ReactNativeWebView
    bridge?.postMessage?.(JSON.stringify({ type: 'edmission.mobileAuthError', message }))
  } catch {
    /* ignore */
  }
}

export function MobileAppAuth() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token') ?? ''
    const next = safeNext(params.get('next'))

    if (!token) {
      const message = 'Mobile sign-in token is missing.'
      setError(message)
      postNativeAuthError(message)
      return
    }

    const exchangePromise =
      exchangeCache?.token === token
        ? exchangeCache.promise
        : exchangeMobileWebAuthSession(token)
    exchangeCache = { token, promise: exchangePromise }

    exchangePromise
      .then(() => {
        if (cancelled) return
        navigate(next, { replace: true })
      })
      .catch((err) => {
        if (cancelled) return
        const message = getApiError(err).message
        setError(message)
        postNativeAuthError(message)
      })

    return () => {
      cancelled = true
    }
  }, [navigate])

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[var(--color-bg)] px-6 text-center">
      {error ? (
        <p className="max-w-sm text-sm leading-6 text-red-600 dark:text-red-300">{error}</p>
      ) : (
        <div className="h-8 w-8 rounded-full border-2 border-[var(--color-primary-accent)] border-t-transparent animate-spin" aria-label="Loading" />
      )}
    </div>
  )
}
