import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useUIStore } from '@/store/uiStore'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void }) => void
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void
          prompt: () => void
        }
      }
    }
  }
}

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
const GOOGLE_ONE_TAP_ALLOWED_PATHS = new Set(['/', '/login', '/register'])

type GoogleSignInButtonProps = {
  disabled?: boolean
  onCredential: (credential: string) => void
  className?: string
  autoPrompt?: boolean
  compact?: boolean
  title?: string
}

/**
 * Renders Google Identity Services button. Requires `VITE_GOOGLE_CLIENT_ID` in env.
 */
export function GoogleSignInButton({
  disabled,
  onCredential,
  className,
  autoPrompt = false,
  compact = false,
  title,
}: GoogleSignInButtonProps) {
  const { pathname } = useLocation()
  const containerRef = useRef<HTMLDivElement>(null)
  const onCredentialRef = useRef(onCredential)
  onCredentialRef.current = onCredential
  const uiTheme = useUIStore((s) => s.theme)

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()

  useEffect(() => {
    if (!clientId || !containerRef.current) return

    let cancelled = false

    const mountButton = () => {
      if (cancelled || !containerRef.current || !window.google?.accounts?.id) return
      const el = containerRef.current
      el.innerHTML = ''
      const htmlIsDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
      const useDarkButton = uiTheme === 'dark' || htmlIsDark
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) onCredentialRef.current(response.credential)
        },
      })
      window.google.accounts.id.renderButton(el, {
        type: compact ? 'icon' : 'standard',
        theme: useDarkButton ? 'filled_black' : 'outline',
        size: 'large',
        text: 'continue_with',
        width: compact ? 44 : 384,
        shape: compact ? 'circle' : 'rectangular',
      })
      const canPromptOnThisPage = GOOGLE_ONE_TAP_ALLOWED_PATHS.has(pathname)
      if (!disabled && autoPrompt && canPromptOnThisPage) {
        window.google.accounts.id.prompt()
      }
    }

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT_SRC}"]`)
    if (window.google?.accounts?.id) {
      mountButton()
    } else if (existingScript) {
      existingScript.addEventListener('load', mountButton, { once: true })
    } else {
      const script = document.createElement('script')
      script.src = GOOGLE_SCRIPT_SRC
      script.async = true
      script.defer = true
      script.onload = mountButton
      document.head.appendChild(script)
    }

    return () => {
      cancelled = true
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [autoPrompt, clientId, disabled, pathname, uiTheme])

  if (!clientId) return null

  return (
    <div className={className} title={title}>
      <div
        ref={containerRef}
        className={
          disabled
            ? 'pointer-events-none opacity-50 flex items-center justify-center [&_iframe]:pointer-events-none'
            : 'flex items-center justify-center'
        }
      />
    </div>
  )
}
