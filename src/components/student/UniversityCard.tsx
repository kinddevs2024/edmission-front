import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MatchScore } from './MatchScore'
import { getImageUrl } from '@/services/upload'
import { useDominantColor } from '@/hooks/useDominantColor'
import { cn } from '@/utils/cn'
import type { UniversityListItem } from '@/types/university'

interface UniversityCardProps {
  university: UniversityListItem
  showMatch?: boolean
  /** When false, min language level and tuition are hidden (e.g. dashboard recommendations). */
  showRequirements?: boolean
  onInterest?: (id: string) => void
  interested?: boolean
  interestDisabled?: boolean
}

export function UniversityCard({ university, showMatch = true, showRequirements = true, onInterest, interested, interestDisabled }: UniversityCardProps) {
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
    minLanguageLevel,
    tuitionPrice,
  } = university

  const logoUrl = logo ? getImageUrl(logo) : null
  const dominantColor = useDominantColor(logoUrl)
  const shadowColor = dominantColor ?? '#22c55e'
  const cardStyle = {
    ...(dominantColor
      ? { background: `linear-gradient(to bottom, ${dominantColor}22 0%, ${dominantColor}14 20%, ${dominantColor}0a 45%, #f2f9f2 100%)` }
      : {}),
    boxShadow: `0 10px 30px -8px ${shadowColor}40, 0 4px 12px -4px ${shadowColor}28`,
  }

  return (
    <Card
      className={cn(
        'flex flex-col h-full relative overflow-hidden transition-all duration-300',
        !dominantColor && 'university-card-bg'
      )}
      style={cardStyle}
      interactive
      tilt
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-4 min-w-0">
          {logo ? (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-card flex-shrink-0 flex items-center justify-center bg-[var(--color-card)]/80 border border-[var(--color-border)]/50 shadow-sm overflow-hidden p-1">
              <img src={logoUrl!} alt="" loading="lazy" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-card bg-[var(--color-border)]/50 flex-shrink-0 flex items-center justify-center">
              <span className="text-2xl text-[var(--color-text-muted)]" aria-hidden>🏛</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base sm:text-lg truncate leading-tight">{name}</CardTitle>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
              {[country, city].filter(Boolean).join(' · ') || '—'}
            </p>
          </div>
        </div>
        {showMatch && matchScore != null && (
          <MatchScore score={matchScore} breakdown={matchBreakdown} variant="badge" size="sm" />
        )}
      </div>
      {description && (
        <p className="text-sm text-[var(--color-text-muted)] line-clamp-2 mb-4 flex-1 leading-relaxed">{description}</p>
      )}
      {showRequirements && (minLanguageLevel || tuitionPrice != null) && (
        <p className="text-xs text-[var(--color-text-muted)] mb-3">
          {[minLanguageLevel, tuitionPrice != null ? (tuitionPrice === 0 ? 'Free' : `$${tuitionPrice.toLocaleString()}/yr`) : null].filter(Boolean).join(' · ')}
        </p>
      )}
      <div className="flex flex-wrap gap-2 mt-auto pt-1">
        {hasScholarship && <Badge variant="success">Scholarship</Badge>}
        <div className="flex gap-2 ml-auto">
          {onInterest && (
            <Button
              variant={interested ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => onInterest(id)}
              disabled={interested || interestDisabled}
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
