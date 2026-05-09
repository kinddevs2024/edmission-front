import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  savePendingTelegramAuthSession,
  startTelegramAuth,
  verifyTelegramAuthLink,
  verifyTelegramAuthReady,
} from '@/services/auth'
import { getApiErrorKey } from '@/utils/apiErrorI18n'
import { navigateAfterLogin } from '@/utils/navigateAfterAuth'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { BrandMark } from '@/components/layout/BrandLogo'
import { ContentFallback } from '@/components/layout/ContentFallback'


const SESSION_ID_REGEX = /^[a-f0-9]{32}$/i
const TOKEN_REGEX = /^[a-f0-9]{48}$/i
const READY_POLL_INTERVAL_MS = 2000
const READY_POLL_MAX_ATTEMPTS = 60

export function TelegramAuth() {
  const { t } = useTranslation(['auth', 'errors'])
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [submitError, setSubmitError] = useState('')
  const [loadingLink, setLoadingLink] = useState(false)
  const [starting, setStarting] = useState(false)
  const [checkingReady, setCheckingReady] = useState(false)
  const autoLinkAttemptedRef = useRef(false)

  const sessionId = String(searchParams.get('sessionId') ?? '').trim().toLowerCase()
  const deepLink = String(searchParams.get('deepLink') ?? '').trim()
  const token = String(searchParams.get('token') ?? '').trim().toLowerCase()
  const roleParam = String(searchParams.get('role') ?? '').trim().toLowerCase()
  const role = roleParam === 'university' ? 'university' : roleParam === 'student' ? 'student' : undefined
  const hasValidSession = useMemo(() => SESSION_ID_REGEX.test(sessionId), [sessionId])
  const hasValidToken = useMemo(() => TOKEN_REGEX.test(token), [token])

  const checkReadyOnce = async (showNotReadyMessage: boolean): Promise<boolean> => {
    if (!hasValidSession) {
      setSubmitError(t('errors:default'))
      return false
    }

    try {
      const data = await verifyTelegramAuthReady({ sessionId })
      if (data?.user) {
        navigateAfterLogin(navigate, data.user)
        return true
      }
      if (showNotReadyMessage) {
        setSubmitError(
          t(
            'auth:telegramCodeNotReady',
            'No confirmation found yet. Open Telegram Bot, share your phone number, then try again.'
          )
        )
      }
      return false
    } catch (err) {
      const key = getApiErrorKey(err)
      setSubmitError(t(`errors:${key}`))
      return false
    }
  }

  useEffect(() => {
    if (!hasValidSession || !hasValidToken || autoLinkAttemptedRef.current) return
    autoLinkAttemptedRef.current = true
    setSubmitError('')
    setLoadingLink(true)
    verifyTelegramAuthLink({ sessionId, token })
      .then(({ user }) => {
        navigateAfterLogin(navigate, user)
      })
      .catch(() => {
        setSearchParams(
          {
            ...(role ? { role } : {}),
          },
          { replace: true }
        )
        setSubmitError(
          t(
            'auth:telegramLinkExpiredStartNew',
            'This Telegram link has expired or was already used. Start a new Telegram session.'
          )
        )
      })
      .finally(() => {
        setLoadingLink(false)
      })
  }, [hasValidSession, hasValidToken, navigate, sessionId, t, token])

  useEffect(() => {
    if (!hasValidSession || hasValidToken) return
    let cancelled = false
    let timeoutId: number | undefined
    let attempts = 0

    setCheckingReady(true)
    const poll = async () => {
      if (cancelled) return
      attempts += 1
      const ready = await checkReadyOnce(false)
      if (cancelled || ready) {
        setCheckingReady(false)
        return
      }
      if (attempts >= READY_POLL_MAX_ATTEMPTS) {
        setCheckingReady(false)
        return
      }
      timeoutId = window.setTimeout(() => {
        void poll()
      }, READY_POLL_INTERVAL_MS)
    }

    void poll()
    return () => {
      cancelled = true
      if (timeoutId != null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [hasValidSession, hasValidToken, sessionId])

  const openTelegramBot = () => {
    if (!deepLink) return
    window.location.href = deepLink
  }

  const startSession = async () => {
    setSubmitError('')
    setStarting(true)
    try {
      const data = await startTelegramAuth(role ? { role } : undefined)
      savePendingTelegramAuthSession({ sessionId: data.sessionId, role })
      setSearchParams(
        {
          sessionId: data.sessionId,
          deepLink: data.deepLink,
          ...(role ? { role } : {}),
        },
        { replace: true }
      )
      window.location.href = data.deepLink
    } catch (err) {
      const key = getApiErrorKey(err)
      setSubmitError(t(`errors:${key}`))
    } finally {
      setStarting(false)
    }
  }

  const onCheckConfirmed = async () => {
    setSubmitError('')
    setCheckingReady(true)
    try {
      await checkReadyOnce(true)
    } finally {
      setCheckingReady(false)
    }
  }

  if (loadingLink || (checkingReady && !submitError)) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <BrandMark className="h-14 w-14" />
          <ContentFallback />
          <p className="text-sm text-[var(--color-text-muted)]">
            {t('auth:telegramWaitingConfirm', 'Waiting for Telegram confirmation...')}
          </p>
        </div>
      </Card>
    )
  }

  if (submitError) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <BrandMark className="h-14 w-14" />
          <CardTitle className="text-red-500">
            {t('errors:somethingWentWrong', 'Something went wrong')}
          </CardTitle>
          <p className="text-sm text-red-500">{submitError}</p>
          <div className="flex w-full flex-col gap-2">
            <Button type="button" className="w-full" onClick={openTelegramBot} disabled={!deepLink}>
              {t('auth:openTelegramBot', 'Open Telegram Bot')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => void startSession()}
              loading={starting}
            >
              {t('auth:startNewTelegramSession', 'Start new Telegram session')}
            </Button>
            <Link to="/login" className="mt-2 block text-sm text-[var(--color-text-muted)] hover:underline">
              {t('common:back', 'Back')}
            </Link>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-col items-center gap-2 text-center">
        <BrandMark className="h-14 w-14" />
        <CardTitle>{t('auth:continueWithTelegram', 'Continue with Telegram')}</CardTitle>
      </div>

      <p className="mb-4 text-sm text-[var(--color-text-muted)]">
        {t(
          'auth:telegramNoCodeHint',
          'Open the Telegram bot, choose a language, send your name and phone number. You will be signed in automatically.'
        )}
      </p>

      <div className="mb-4 flex flex-col gap-2">
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={openTelegramBot}
          disabled={!deepLink || loadingLink || starting || checkingReady}
        >
          {t('auth:openTelegramBot', 'Open Telegram Bot')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => void startSession()}
          loading={starting}
          disabled={loadingLink || starting || checkingReady}
        >
          {t('auth:startNewTelegramSession', 'Start new Telegram session')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => void onCheckConfirmed()}
          loading={checkingReady}
          disabled={loadingLink || starting || checkingReady || !hasValidSession}
        >
          {t('auth:iConfirmedInTelegram', 'I confirmed in Telegram')}
        </Button>
      </div>

      <Link to="/login" className="mt-4 block text-center text-sm text-[var(--color-text-muted)] hover:underline">
        {t('common:back', 'Back')}
      </Link>
    </Card>
  )
}

