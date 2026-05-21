const TELEGRAM_GREEN = '#84CC16'
const TELEGRAM_GREEN_TEXT = '#0F172A'

type TelegramMainButton = {
  setParams?: (params: { color?: string; text_color?: string }) => void
}

type TelegramWebApp = {
  ready?: () => void
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
  setBottomBarColor?: (color: string) => void
  MainButton?: TelegramMainButton
}

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: TelegramWebApp
  }
}

export function applyTelegramWebAppBranding(): void {
  const webApp = (window as TelegramWindow).Telegram?.WebApp
  if (!webApp) return

  try {
    webApp.ready?.()
    webApp.setHeaderColor?.(TELEGRAM_GREEN)
    webApp.setBottomBarColor?.(TELEGRAM_GREEN)
    webApp.setBackgroundColor?.('#F8FAFC')
    webApp.MainButton?.setParams?.({
      color: TELEGRAM_GREEN,
      text_color: TELEGRAM_GREEN_TEXT,
    })
  } catch {
    /* Telegram WebApp methods vary by client version. */
  }
}
