import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageTitle } from '@/components/ui/PageTitle'
import { getOffers, acceptOffer, declineOffer } from '@/services/student'
import { Check, X } from 'lucide-react'
import { formatDate, daysUntil } from '@/utils/format'
import type { Offer } from '@/types/student'

export function StudentOffers() {
  const { t } = useTranslation(['common', 'student'])
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<{ id: string; action: 'accept' | 'decline' } | null>(null)

  useEffect(() => {
    getOffers({ limit: 50 })
      .then((res) => setOffers(res.data ?? []))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false))
  }, [])

  const handleAccept = (id: string) => {
    setActionLoading({ id, action: 'accept' })
    acceptOffer(id)
      .then(() => setOffers((prev) => prev.filter((o) => o.id !== id)))
      .catch(() => {})
      .finally(() => setActionLoading(null))
  }

  const handleDecline = (id: string) => {
    setActionLoading({ id, action: 'decline' })
    declineOffer(id)
      .then(() => setOffers((prev) => prev.filter((o) => o.id !== id)))
      .catch(() => {})
      .finally(() => setActionLoading(null))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <PageTitle title="My Offers" icon="Gift" />
        <Card><div className="h-32 animate-pulse rounded bg-[var(--color-border)]" /></Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageTitle title="My Offers" icon="Gift" />

      {offers.length === 0 ? (
        <Card>
          <EmptyState
            title={t('student:noOffers')}
            description={t('student:noOffersDesc')}
            actionLabel={t('student:exploreUniversities')}
            actionTo="/student/universities"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map((o) => {
            const days = daysUntil(o.deadline)
            const urgent = o.isUrgent ?? days <= 3
            return (
              <Card key={o.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle>{o.universityName ?? o.universityId}</CardTitle>
                  {urgent && <Badge variant="warning">Urgent · {days} days left</Badge>}
                </div>
                <div className="text-sm text-[var(--color-text-muted)] space-y-1">
                  <p>Scholarship: {o.scholarshipType} {o.coveragePercent != null && `(${o.coveragePercent}%)`}</p>
                  <p>Deadline: {formatDate(o.deadline)}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={() => handleAccept(o.id)} disabled={!!actionLoading} loading={actionLoading?.id === o.id && actionLoading?.action === 'accept'} icon={<Check size={16} />}>{t('student:accept')}</Button>
                  <Button size="sm" variant="secondary" onClick={() => handleDecline(o.id)} disabled={!!actionLoading} loading={actionLoading?.id === o.id && actionLoading?.action === 'decline'} icon={<X size={16} />}>{t('student:decline')}</Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
