import { AppVersionCorner } from '@/components/AppVersionCorner'
import { Router } from './Router'

export function App() {
  return (
    <div className="relative flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <Router />
      <AppVersionCorner />
    </div>
  )
}
