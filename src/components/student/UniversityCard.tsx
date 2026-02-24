import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MatchScore } from './MatchScore'
import type { UniversityListItem } from '@/types/university'

interface UniversityCardProps {
  university: UniversityListItem
  showMatch?: boolean
  onInterest?: (id: string) => void
  interested?: boolean
}

export function UniversityCard({ university, showMatch = true, onInterest, interested }: UniversityCardProps) {
  const {
    id,
    name,
    logo,
    country,
    city,
    description,
    hasScholarship,
    matchScore,
    matchBreakdown,
  } = university

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          {logo ? (
            <img src={logo} alt="" className="w-12 h-12 rounded-input object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-input bg-[var(--color-border)] flex-shrink-0" />
          )}
          <div className="min-w-0">
            <CardTitle className="truncate">{name}</CardTitle>
            <p className="text-sm text-[var(--color-text-muted)]">
              {[country, city].filter(Boolean).join(' · ') || '—'}
            </p>
          </div>
        </div>
        {showMatch && matchScore != null && (
          <MatchScore score={matchScore} breakdown={matchBreakdown} variant="badge" size="sm" />
        )}
      </div>
      {description && (
        <p className="text-sm text-[var(--color-text-muted)] line-clamp-2 mb-3 flex-1">{description}</p>
      )}
      <div className="flex flex-wrap gap-2 mt-auto">
        {hasScholarship && <Badge variant="success">Scholarship</Badge>}
        <div className="flex gap-2 ml-auto">
          {onInterest && (
            <Button
              variant={interested ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => onInterest(id)}
              disabled={interested}
            >
              {interested ? 'Interested' : 'Interest'}
            </Button>
          )}
          <Button to={`/student/universities/${id}`} variant="ghost" size="sm">
            Details
          </Button>
        </div>
      </div>
    </Card>
  )
}
