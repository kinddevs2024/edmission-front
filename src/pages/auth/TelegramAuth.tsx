import { type FormEvent, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { startTelegramAuth, verifyTelegramAuth } from '@/services/auth'
import { getApiErrorKey } from '@/utils/apiErrorI18n'
import { navigateAfterLogin } from '@/utils/navigateAfterAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardTitle } from '@/components/ui/Card'
import { BrandMark } from '@/components/layout/BrandLogo'

const SESSION_ID_REGEX = /^[a-f0-9]{32}$/i

export function TelegramAuth() {
  const { t } = useTranslation(['auth', 'errors'])
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [code, setCode] = useState('')

  const sessionId = String(searchParams.get('sessionId') ?? '').trim().toLowerCase()
  const deepLink = String(searchParams.get('deepLink') ?? '').trim()
  const hasValidSession = useMemo(() => SESSION_ID_REGEX.test(sessionId), [sessionId])

  const openTelegramBot = () => {
    if (!deepLink) return
    window.open(deepLink, '_blank', 'noopener,noreferrer')
  }

  const startSession = async () => {
    setSubmitError('')
    setStarting(true)
    try {
      const data = await startTelegramAuth()
      setSearchParams(
        {
          sessionId: data.sessionId,
          deepLink: data.deepLink,
        },
        { replace: true }
      )
      window.open(data.deepLink, '_blank', 'noopener,noreferrer')
    } catch (err) {
      const key = getApiErrorKey(err)
      setSubmitError(t(`errors:${key}`))
    } finally {
      setStarting(false)
    }
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!hasValidSession) {
      setSubmitError(t('errors:default'))
      return
    }

    const normalizedCode = code.replace(/\D/g, '').slice(0, 6)
    if (normalizedCode.length !== 6) {
      setSubmitError(t('auth:enterCode') + ' - 6 digits')
      return
    }

    setSubmitError('')
    setLoading(true)
    try {
      const { user } = await verifyTelegramAuth({
        sessionId,
        code: normalizedCode,
      })
      navigateAfterLogin(navigate, user)
    } catch (err) {
      const key = getApiErrorKey(err)
      setSubmitError(t(`errors:${key}`))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-col items-center gap-2 text-center">
        <BrandMark className="h-14 w-14" />
        <CardTitle>Enter the code from Telegram</CardTitle>
      </div>

      <p className="mb-4 text-sm text-[var(--color-text-muted)]">
        Open the bot, share your phone number, then enter the 6-digit code you received.
      </p>

      <div className="mb-4 flex flex-col gap-2">
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={openTelegramBot}
          disabled={!deepLink || loading || starting}
        >
          Open Telegram Bot
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => void startSession()}
          loading={starting}
          disabled={loading || starting}
        >
          Start new Telegram session
        </Button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label={t('auth:enterCode')}
          value={code}
          autoComplete="one-time-code"
          placeholder={t('auth:codePlaceholder')}
          maxLength={6}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 6)
            setCode(value)
            if (submitError) setSubmitError('')
          }}
        />
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <Button type="submit" className="w-full" loading={loading} disabled={loading || starting || !hasValidSession}>
          Sign in
        </Button>
      </form>

      <Link to="/login" className="mt-4 block text-center text-sm text-[var(--color-text-muted)] hover:underline">
        Back to sign in
      </Link>
    </Card>
  )
}
