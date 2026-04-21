import { AppVersionCorner } from '@/components/AppVersionCorner'
import { GoogleOneTapPrompt } from '@/components/auth/GoogleOneTapPrompt'
import { TelegramAuthAutoLoginWatcher } from '@/components/auth/TelegramAuthAutoLoginWatcher'
import { Router } from './Router'

export function App() {
  return (
    <div className="relative flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <Router />
      <GoogleOneTapPrompt />
      <TelegramAuthAutoLoginWatcher />
      <AppVersionCorner />
    </div>
  )
}
