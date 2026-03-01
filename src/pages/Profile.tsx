import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { getProfile, updateProfile, getApiError } from '@/services/auth'
import { setup2FA, verifyAndEnable2FA, disable2FA } from '@/services/twoFactor'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { NotificationPreferences } from '@/types/user'

export function Profile() {
  const { t } = useTranslation('common')
  const { user } = useAuth()
  const prefs = user?.notificationPreferences ?? { emailApplicationUpdates: true, emailTrialReminder: true }

  const handlePrefChange = (key: keyof NotificationPreferences, value: boolean) => {
    const next = { ...prefs, [key]: value }
    updateProfile({ notificationPreferences: next })
      .then(() => getProfile())
      .catch(() => {})
  }

  const [twoFaStep, setTwoFaStep] = useState<'idle' | 'setup' | 'verify' | 'disable'>('idle')
  const [twoFaSecret, setTwoFaSecret] = useState<{ secret: string; qrUrl: string } | null>(null)
  const [twoFaCode, setTwoFaCode] = useState('')
  const [twoFaError, setTwoFaError] = useState('')
  const [twoFaLoading, setTwoFaLoading] = useState(false)

  const handleSetup2FA = () => {
    setTwoFaError('')
    setTwoFaLoading(true)
    setup2FA()
      .then((r) => { setTwoFaSecret(r); setTwoFaStep('setup') })
      .catch((e) => setTwoFaError(getApiError(e).message))
      .finally(() => setTwoFaLoading(false))
  }

  const handleVerify2FA = () => {
    if (!twoFaCode.trim()) return
    setTwoFaError('')
    setTwoFaLoading(true)
    verifyAndEnable2FA(twoFaCode.trim())
      .then(() => { setTwoFaStep('idle'); setTwoFaSecret(null); setTwoFaCode(''); getProfile() })
      .catch((e) => setTwoFaError(getApiError(e).message))
      .finally(() => setTwoFaLoading(false))
  }

  const handleDisable2FA = () => {
    if (!twoFaCode.trim()) return
    setTwoFaError('')
    setTwoFaLoading(true)
    disable2FA(twoFaCode.trim())
      .then(() => { setTwoFaStep('idle'); setTwoFaCode(''); getProfile() })
      .catch((e) => setTwoFaError(getApiError(e).message))
      .finally(() => setTwoFaLoading(false))
  }

  const totpEnabled = !!user?.totpEnabled

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card>
        <CardTitle>{t('profile')}</CardTitle>
        <dl className="grid grid-cols-1 gap-2 mt-2">
          <dt className="text-[var(--color-text-muted)]">{t('common:email')}</dt>
          <dd>{user?.email}</dd>
          <dt className="text-[var(--color-text-muted)]">{t('common:name')}</dt>
          <dd>{user?.name ?? '—'}</dd>
          <dt className="text-[var(--color-text-muted)]">{t('common:role')}</dt>
          <dd>{user?.role}</dd>
        </dl>
      </Card>

      <Card>
        <CardTitle>Notification preferences</CardTitle>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Choose which emails you want to receive.</p>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!prefs.emailApplicationUpdates}
              onChange={(e) => handlePrefChange('emailApplicationUpdates', e.target.checked)}
              className="rounded border-[var(--color-border)]"
              aria-label="Email when application status changes"
            />
            <span className="text-sm">Email when application status changes</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!prefs.emailTrialReminder}
              onChange={(e) => handlePrefChange('emailTrialReminder', e.target.checked)}
              className="rounded border-[var(--color-border)]"
              aria-label="Trial ending reminder"
            />
            <span className="text-sm">Trial ending reminder (2 days before)</span>
          </label>
        </div>
      </Card>

      <Card>
        <CardTitle>Two-factor authentication (2FA)</CardTitle>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Add an extra layer of security to your account with an authenticator app (e.g. Google Authenticator).
        </p>
        {twoFaError && <p className="text-sm text-red-500 mt-2">{twoFaError}</p>}
        {twoFaStep === 'idle' && (
          <div className="mt-4">
            {totpEnabled ? (
              <>
                <p className="text-sm text-green-600 dark:text-green-400 mb-2">2FA is enabled.</p>
                <Button size="sm" variant="secondary" onClick={() => { setTwoFaStep('disable'); setTwoFaCode('') }}>
                  Disable 2FA
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={handleSetup2FA} loading={twoFaLoading}>
                Enable 2FA
              </Button>
            )}
          </div>
        )}
        {twoFaStep === 'setup' && twoFaSecret && (
          <div className="mt-4 space-y-3">
            <p className="text-sm">Scan this QR code with your authenticator app, or enter the secret manually:</p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFaSecret.qrUrl)}`}
              alt="QR code for 2FA"
              width={200}
              height={200}
              className="border border-[var(--color-border)] rounded"
            />
            <p className="text-xs font-mono text-[var(--color-text-muted)] break-all">{twoFaSecret.secret}</p>
            <div className="flex gap-2 items-end">
              <Input
                label="Verification code"
                value={twoFaCode}
                onChange={(e) => setTwoFaCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="w-32"
              />
              <Button size="sm" onClick={handleVerify2FA} disabled={twoFaCode.length < 6} loading={twoFaLoading}>
                Verify and enable
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setTwoFaStep('idle'); setTwoFaSecret(null); setTwoFaCode('') }}>
              Cancel
            </Button>
          </div>
        )}
        {twoFaStep === 'disable' && (
          <div className="mt-4 space-y-3">
            <Input
              label="Enter your current 2FA code to disable"
              value={twoFaCode}
              onChange={(e) => setTwoFaCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className="w-32"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="danger" onClick={handleDisable2FA} disabled={twoFaCode.length < 6} loading={twoFaLoading}>
                Disable 2FA
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setTwoFaStep('idle'); setTwoFaCode('') }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
