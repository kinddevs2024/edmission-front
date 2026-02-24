import { useEffect, useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { getOffers, acceptOffer, declineOffer } from '@/services/student'
import { formatDate, daysUntil } from '@/utils/format'
import type { Offer } from '@/types/student'

export function StudentOffers() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOffers({ limit: 50 })
      .then((res) => setOffers(res.data ?? []))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false))
  }, [])

  const handleAccept = (id: string) => {
    acceptOffer(id).then(() => setOffers((prev) => prev.filter((o) => o.id !== id))).catch(() => {})
  }

  const handleDecline = (id: string) => {
    declineOffer(id).then(() => setOffers((prev) => prev.filter((o) => o.id !== id))).catch(() => {})
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-h1">My Offers</h1>
        <Card><div className="h-32 animate-pulse rounded bg-[var(--color-border)]" /></Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-h1">My Offers</h1>

      {offers.length === 0 ? (
        <Card>
          <EmptyState
            title="No offers yet"
            description="Show interest to universities and wait for offers."
            actionLabel="Explore universities"
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
                  <Button size="sm" onClick={() => handleAccept(o.id)}>Accept</Button>
                  <Button size="sm" variant="secondary" onClick={() => handleDecline(o.id)}>Decline</Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
