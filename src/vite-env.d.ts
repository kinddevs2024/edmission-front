/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  /** Google OAuth 2.0 Web client ID (Google Cloud Console → APIs & Services → Credentials) */
  readonly VITE_GOOGLE_CLIENT_ID?: string
  /** Yandex OAuth app ID (same as YANDEX_CLIENT_ID on backend); redirect: `{origin}/auth/yandex/callback` */
  readonly VITE_YANDEX_CLIENT_ID?: string
  /** Optional full URL for OAuth code redirect (default `{origin}/auth/yandex/callback`) */
  readonly VITE_YANDEX_REDIRECT_URI?: string
  /** Optional full URL for Passport SDK redirect (default `{origin}/suggest/token.html`) */
  readonly VITE_YANDEX_SUGGEST_REDIRECT_URI?: string
  /** Optional Telegram bot URL for onboarding (e.g. https://t.me/your_bot) */
  readonly VITE_TELEGRAM_BOT_URL?: string
  /** ElevenLabs Conversational AI agent ID used by the support call UI */
  readonly VITE_ELEVENLABS_AGENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
