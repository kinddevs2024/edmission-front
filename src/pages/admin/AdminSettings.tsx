import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { getSettings, updateSettings, type SystemSettings } from '@/services/admin'
import { toastApiError } from '@/utils/toastError'
import { toast } from 'sonner'

export function AdminSettings() {
  const { t } = useTranslation('admin')
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch((e) => {
        toastApiError(e)
        setSettings({
          requireAccountConfirmation: false,
          requireEmailVerification: false,
          maintenanceMode: false,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (key: keyof SystemSettings, value: boolean) => {
    if (!settings) return
    setSaving(key)
    try {
      const updated = await updateSettings({ [key]: value })
      setSettings(updated)
      toast.success(t('settings.saved'))
    } catch (e) {
      toastApiError(e)
    } finally {
      setSaving(null)
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-page-bottom-cta">
      <PageTitle title={t('settings.title', 'System settings')} icon="Settings" />

      <Card>
        <CardTitle>{t('settings.accountAndAccess', 'Account & access')}</CardTitle>
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] p-4">
            <div>
              <p className="font-medium text-[var(--color-text)]">
                {t('settings.requireAccountConfirmation', 'Require account confirmation')}
              </p>
              <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                {t('settings.requireAccountConfirmationDesc', 'Universities must be verified by admin before they can use the platform.')}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.requireAccountConfirmation}
              disabled={saving === 'requireAccountConfirmation'}
              onClick={() => handleToggle('requireAccountConfirmation', !settings.requireAccountConfirmation)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-2 disabled:opacity-50 ${
                settings.requireAccountConfirmation ? 'bg-primary-accent' : 'bg-[var(--color-border)]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                  settings.requireAccountConfirmation ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] p-4">
            <div>
              <p className="font-medium text-[var(--color-text)]">
                {t('settings.requireEmailVerification', 'Require email verification')}
              </p>
              <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                {t('settings.requireEmailVerificationDesc', 'Users must verify their email before they can sign in.')}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.requireEmailVerification}
              disabled={saving === 'requireEmailVerification'}
              onClick={() => handleToggle('requireEmailVerification', !settings.requireEmailVerification)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-2 disabled:opacity-50 ${
                settings.requireEmailVerification ? 'bg-primary-accent' : 'bg-[var(--color-border)]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                  settings.requireEmailVerification ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] p-4">
            <div>
              <p className="font-medium text-[var(--color-text)]">
                {t('settings.maintenanceMode', 'Maintenance mode')}
              </p>
              <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                {t('settings.maintenanceModeDesc', 'Close the site for non-admins. Only admins can access the platform.')}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.maintenanceMode}
              disabled={saving === 'maintenanceMode'}
              onClick={() => handleToggle('maintenanceMode', !settings.maintenanceMode)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-2 disabled:opacity-50 ${
                settings.maintenanceMode ? 'bg-amber-500' : 'bg-[var(--color-border)]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                  settings.maintenanceMode ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
