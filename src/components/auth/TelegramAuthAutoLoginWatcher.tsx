import axios from 'axios'
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  clearPendingTelegramAuthSession,
  getPendingTelegramAuthSession,
  verifyTelegramAuthReady,
} from '@/services/auth'
import { navigateAfterLogin } from '@/utils/navigateAfterAuth'

const TELEGRAM_PENDING_SESSION_MAX_AGE_MS = 16 * 60 * 1000
const TELEGRAM_READY_POLL_INTERVAL_MS = 2000

export function TelegramAuthAutoLoginWatcher() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const inFlightRef = useRef(false)

  useEffect(() => {
    if (isAuthenticated) {
      clearPendingTelegramAuthSession()
      return
    }
    if (location.pathname === '/auth/telegram') {
      return
    }

    const pending = getPendingTelegramAuthSession()
    if (!pending) return

    const isExpired = Date.now() - pending.startedAt > TELEGRAM_PENDING_SESSION_MAX_AGE_MS
    if (isExpired) {
      clearPendingTelegramAuthSession()
      return
    }

    let stopped = false
    let intervalId: number | undefined

    const tick = async () => {
      if (stopped || inFlightRef.current) return
      inFlightRef.current = true
      try {
        const data = await verifyTelegramAuthReady({ sessionId: pending.sessionId })
        if (data?.user) {
          clearPendingTelegramAuthSession()
          stopped = true
          navigateAfterLogin(navigate, data.user, { replace: true })
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const status = Number(err.response?.status ?? 0)
          if (status === 400 || status === 404) {
            clearPendingTelegramAuthSession()
            stopped = true
          }
        }
      } finally {
        inFlightRef.current = false
      }
    }

    void tick()
    intervalId = window.setInterval(() => {
      if (stopped) {
        if (intervalId != null) {
          window.clearInterval(intervalId)
        }
        return
      }
      if (Date.now() - pending.startedAt > TELEGRAM_PENDING_SESSION_MAX_AGE_MS) {
        clearPendingTelegramAuthSession()
        stopped = true
        if (intervalId != null) {
          window.clearInterval(intervalId)
        }
        return
      }
      void tick()
    }, TELEGRAM_READY_POLL_INTERVAL_MS)

    return () => {
      stopped = true
      if (intervalId != null) {
        window.clearInterval(intervalId)
      }
    }
  }, [isAuthenticated, location.pathname, navigate])

  return null
}
