import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'

export function SchoolDashboard() {
  const { t } = useTranslation('school')

  return (
    <div className="space-y-6">
      <PageTitle title={t('dashboard')} icon="LayoutDashboard" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/school/my-school">
          <Card className="h-full hover:border-primary-accent transition-colors cursor-pointer">
            <CardTitle>{t('mySchool')}</CardTitle>
            <p className="text-[var(--color-text-muted)] mt-1">{t('mySchoolHint')}</p>
          </Card>
        </Link>
        <Link to="/school/my-students">
          <Card className="h-full hover:border-primary-accent transition-colors cursor-pointer">
            <CardTitle>{t('myStudents')}</CardTitle>
            <p className="text-[var(--color-text-muted)] mt-1">{t('myStudentsHint')}</p>
          </Card>
        </Link>
        <Link to="/school/join-requests">
          <Card className="h-full hover:border-primary-accent transition-colors cursor-pointer">
            <CardTitle>{t('joinRequests')}</CardTitle>
            <p className="text-[var(--color-text-muted)] mt-1">{t('joinRequestsHint')}</p>
          </Card>
        </Link>
      </div>
    </div>
  )
}
