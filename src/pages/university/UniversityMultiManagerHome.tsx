import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageTitle } from '@/components/ui/PageTitle'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { getProfile } from '@/services/auth'
import { setActAsUniversityUserId } from '@/constants/actAsUniversity'
import { getImageUrl } from '@/services/upload'
import type { User } from '@/types/user'

export function UniversityMultiManagerHome() {
  const { t } = useTranslation(['university', 'common'])
  const navigate = useNavigate()
  const { user, setUser } = useAuth()
  const [me, setMe] = useState<User | null>(user)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getProfile()
      .then((u) => {
        setMe(u)
        setUser(u)
      })
      .catch(() => {
        setMe(null)
      })
      .finally(() => setLoading(false))
  }, [setUser])

  const list = me?.managedUniversities ?? []
  const approved = me?.universityMultiManagerApproved === true

  const enterAs = (universityUserId: string) => {
    setActAsUniversityUserId(universityUserId)
    navigate('/university/dashboard')
  }

  return (
    <div className="mx-auto max-w-content w-full space-y-6 px-2 py-6 sm:px-4">
      <PageTitle title={t('university:multiManagerTitle', 'Your universities')} icon="Building2" />
      <p className="text-sm text-[var(--color-text-muted)]">
        {t(
          'university:multiManagerIntro',
          'Choose a university to work in its dashboard. Your session uses that account until you leave the university area or clear the choice from your hub.'
        )}
      </p>

      {!approved ? (
        <Card className="border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-100">
          {t(
            'university:multiManagerPendingApproval',
            'Your access is not approved yet. An administrator must confirm your assignment before you can open a university.'
          )}
        </Card>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--color-text-muted)]">{t('common:loading', 'Loading...')}</p>
      ) : list.length === 0 ? (
        <Card className="border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-text-muted)]">
          {t('university:multiManagerNoUniversities', 'No universities are assigned to your account yet. Ask an administrator to link university accounts.')}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((u) => (
            <Card key={u.userId} className="flex flex-col gap-3 border border-[var(--color-border)] p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-card)] flex items-center justify-center">
                  {u.logoUrl ? (
                    <img src={getImageUrl(u.logoUrl)} alt="" className="h-full w-full object-contain p-1" />
                  ) : (
                    <span className="text-xs text-[var(--color-text-muted)]">U</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{u.universityName || u.userId}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {u.verified ? t('university:verified', 'Verified') : t('university:pendingVerification', 'Pending verification')}
                  </p>
                </div>
              </div>
              <Button disabled={!approved} onClick={() => enterAs(u.userId)}>
                {t('university:multiManagerOpen', 'Open as this university')}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
