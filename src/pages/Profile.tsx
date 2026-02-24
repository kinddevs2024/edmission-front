import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardTitle } from '@/components/ui/Card'

export function Profile() {
  const { t } = useTranslation('common')
  const { user } = useAuth()

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card>
        <CardTitle>{t('profile')}</CardTitle>
        <dl className="grid grid-cols-1 gap-2 mt-2">
          <dt className="text-[var(--color-text-muted)]">Email</dt>
          <dd>{user?.email}</dd>
          <dt className="text-[var(--color-text-muted)]">Name</dt>
          <dd>{user?.name ?? '—'}</dd>
          <dt className="text-[var(--color-text-muted)]">Role</dt>
          <dd>{user?.role}</dd>
        </dl>
      </Card>
    </div>
  )
}
