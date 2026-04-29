import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BackLink } from '@/components/ui/BackLink'
import { AdminAccountCredentials } from '@/components/admin/AdminAccountCredentials'
import { UniversityProfilePage } from '@/pages/university/UniversityProfilePage'

export function AdminUniversityProfile() {
  const { userId } = useParams<{ userId: string }>()
  const { t } = useTranslation(['admin', 'common'])

  if (!userId) {
    return (
      <div className="space-y-4">
        <BackLink to="/admin/users">{t('common:back', 'Back')}</BackLink>
        <p className="text-[var(--color-text-muted)]">{t('admin:invalidUser', 'Invalid user.')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <BackLink to="/admin/users">{t('admin:backToUsers', 'Back to users')}</BackLink>
      <AdminAccountCredentials userId={userId} />
      <UniversityProfilePage adminEditUserId={userId} />
    </div>
  )
}
