import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageTitle } from '@/components/ui/PageTitle'
import { getOffers, acceptOffer, declineOffer, waitOffer } from '@/services/student'
import { toastApiError } from '@/utils/toastError'
import { Check, X, Gift, PartyPopper } from 'lucide-react'
import { formatDate, daysUntil } from '@/utils/format'
import type { Offer } from '@/types/student'
import { Modal } from '@/components/ui/Modal'
import { OfferCertificateView } from '@/components/student/OfferCertificateView'

export function StudentOffers() {
  const { t } = useTranslation(['common', 'student'])
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<{ id: string; action: 'accept' | 'decline' | 'wait' } | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    getOffers({ limit: 50 })
      .then((res) => setOffers(res.data ?? []))
      .catch((e) => { toastApiError(e); setOffers([]) })
      .finally(() => setLoading(false))
  }, [])

  const handleAccept = (id: string) => {
    setActionLoading({ id, action: 'accept' })
    acceptOffer(id)
      .then(() => {
        setOffers((prev) => prev.filter((o) => o.id !== id))
        setSelectedId(null)
      })
      .catch(toastApiError)
      .finally(() => setActionLoading(null))
  }

  const handleDecline = (id: string) => {
    setActionLoading({ id, action: 'decline' })
    declineOffer(id)
      .then(() => {
        setOffers((prev) => prev.filter((o) => o.id !== id))
        setSelectedId(null)
      })
      .catch(toastApiError)
      .finally(() => setActionLoading(null))
  }

  const handleWait = (id: string) => {
    setActionLoading({ id, action: 'wait' })
    waitOffer(id)
      .then(() => {
        setOffers((prev) =>
          prev.map((o) => (o.id === id
            ? { ...o, status: 'waiting' as any, expiresAt: (o as any).expiresAt ?? new Date().toISOString() }
            : o))
        )
        setSelectedId(null)
      })
      .catch(toastApiError)
      .finally(() => setActionLoading(null))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <PageTitle title={t('common:myOffers')} icon="Gift" />
        <Card><div className="h-32 animate-pulse rounded bg-[var(--color-border)]" /></Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageTitle title={t('common:myOffers')} icon="Gift" />

      {offers.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Gift className="w-14 h-14 text-[var(--color-text-muted)] opacity-60" />}
            title={t('student:noOffers', 'No offers yet')}
            description={t('student:noOffersDesc', 'Show interest to universities and wait for offers.')}
            actionLabel={t('student:exploreUniversities', 'Explore universities')}
            actionTo="/student/universities"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map((o) => {
            const days = daysUntil(o.deadline)
            const urgent = o.isUrgent ?? days <= 3
            return (
              <Card key={o.id} className="flex flex-col" interactive>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle>{o.universityName ?? o.universityId}</CardTitle>
                  {urgent && <Badge variant="warning">Urgent · {days} days left</Badge>}
                </div>
                <div className="text-sm text-[var(--color-text-muted)] space-y-1">
                  <p>Scholarship: {o.scholarshipType} {o.coveragePercent != null && `(${o.coveragePercent}%)`}</p>
                  <p>Deadline: {formatDate(o.deadline)}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelectedId(o.id)}
                    icon={<PartyPopper size={16} />}
                  >
                    {t('student:viewOffer', 'View offer')}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={!!selectedId}
        onClose={() => !actionLoading && setSelectedId(null)}
        title={(
          <div className="flex items-center gap-2">
            <PartyPopper className="w-5 h-5 text-[var(--color-primary-accent)]" />
            <span>{t('student:offerCongratsTitle', 'Congratulations!')}</span>
          </div>
        )}
        footer={selectedId ? (
          <div className="flex w-full justify-between">
            <div className="text-xs text-[var(--color-text-muted)] flex items-center">
              {/* Timer/extra info can be added here later */}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => selectedId && handleWait(selectedId)}
                disabled={!!actionLoading}
                loading={actionLoading?.id === selectedId && actionLoading?.action === 'wait'}
              >
                {t('student:wait', 'Decide later')}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => selectedId && handleDecline(selectedId)}
                disabled={!!actionLoading}
                loading={actionLoading?.id === selectedId && actionLoading?.action === 'decline'}
                icon={<X size={16} />}
              >
                {t('student:decline')}
              </Button>
              <Button
                size="sm"
                onClick={() => selectedId && handleAccept(selectedId)}
                disabled={!!actionLoading}
                loading={actionLoading?.id === selectedId && actionLoading?.action === 'accept'}
                icon={<Check size={16} />}
              >
                {t('student:accept')}
              </Button>
            </div>
          </div>
        ) : undefined}
      >
        {selectedId && (
          <div className="relative py-4">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="animate-float-slow absolute -left-10 top-0 h-32 w-32 rounded-full bg-pink-500/10 blur-2xl" />
              <div className="animate-float-slow absolute -right-8 bottom-0 h-28 w-28 rounded-full bg-sky-500/10 blur-2xl" />
            </div>
            <div className="relative space-y-4">
              <p className="text-center text-sm text-[var(--color-text-muted)]">
                {t('student:offerCongratsBody', 'You have received a special offer. Here is your certificate.')}
              </p>
              <OfferCertificateView
                offer={offers.find((o) => o.id === selectedId)! as any}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
