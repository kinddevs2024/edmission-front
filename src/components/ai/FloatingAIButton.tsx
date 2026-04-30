import { useLocation } from 'react-router-dom'
import { ElevenLabsFloatingSupport, useElevenLabsSupport } from './ElevenLabsSupport'

export function FloatingAIButton() {
  const location = useLocation()
  const { hasStarted } = useElevenLabsSupport()
  const isAIPage = location.pathname === '/ai' || location.pathname.endsWith('/ai')
  const isSearchPage = location.pathname === '/search'

  if (isAIPage || (isSearchPage && !hasStarted)) return null

  return <ElevenLabsFloatingSupport />
}
