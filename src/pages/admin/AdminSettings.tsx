import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { Switch } from '@/components/ui/Switch'
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
            <Switch
              checked={settings.requireAccountConfirmation}
              label={t('settings.requireAccountConfirmation', 'Require account confirmation')}
              disabled={saving === 'requireAccountConfirmation'}
              onClick={() => handleToggle('requireAccountConfirmation', !settings.requireAccountConfirmation)}
            />
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
            <Switch
              checked={settings.requireEmailVerification}
              label={t('settings.requireEmailVerification', 'Require email verification')}
              disabled={saving === 'requireEmailVerification'}
              onClick={() => handleToggle('requireEmailVerification', !settings.requireEmailVerification)}
            />
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
            <Switch
              checked={settings.maintenanceMode}
              tone="warning"
              label={t('settings.maintenanceMode', 'Maintenance mode')}
              disabled={saving === 'maintenanceMode'}
              onClick={() => handleToggle('maintenanceMode', !settings.maintenanceMode)}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
