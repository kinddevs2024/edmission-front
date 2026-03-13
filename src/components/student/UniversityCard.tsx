import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MatchScore } from './MatchScore'
import { getImageUrl } from '@/services/upload'
import { Wallet, Wrench, Code, FlaskConical, Palette, Heart, Scale, GraduationCap, type LucideIcon } from 'lucide-react'
import type { UniversityListItem } from '@/types/university'

const FACULTY_ICONS: Record<string, LucideIcon> = {
  business_management_economics: Wallet,
  engineering_technology: Wrench,
  computer_science_digital_technologies: Code,
  natural_sciences: FlaskConical,
  health_medical_sciences: Heart,
  social_sciences_humanities: Palette,
  creative_arts_media_design: Palette,
  education: GraduationCap,
  environment_agriculture_sustainability: FlaskConical,
  hospitality_tourism_service: Wallet,
  law_legal_studies: Scale,
}

interface UniversityCardProps {
  university: UniversityListItem
  showMatch?: boolean
  onInterest?: (id: string) => void
  interested?: boolean
  interestDisabled?: boolean
}

export function UniversityCard({ university, showMatch = true, onInterest, interested, interestDisabled }: UniversityCardProps) {
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
    facultyCodes,
  } = university

  const firstFaculty = facultyCodes?.[0]
  const FacultyIcon = firstFaculty ? (FACULTY_ICONS[firstFaculty] ?? GraduationCap) : GraduationCap

  return (
    <Card
      className="flex flex-col h-full relative overflow-hidden bg-gradient-to-b from-primary-accent/10 from-0% via-primary-accent/5 via-30% to-[var(--color-card)] to-100% dark:from-primary-accent/15 dark:via-primary-accent/8 dark:to-[var(--color-card)]"
      interactive
      tilt
    >
      <div className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-[var(--color-card)]/80 dark:bg-[var(--color-card)]/90 flex items-center justify-center text-[var(--color-text-muted)]">
        <FacultyIcon className="w-4 h-4" aria-hidden />
      </div>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          {logo ? (
            <img src={getImageUrl(logo)} alt="" loading="lazy" className="w-12 h-12 rounded-input object-contain bg-[var(--color-border)]/30 flex-shrink-0 p-0.5" />
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
      {(minLanguageLevel || tuitionPrice != null) && (
        <p className="text-xs text-[var(--color-text-muted)] mb-2">
          {[minLanguageLevel, tuitionPrice != null ? (tuitionPrice === 0 ? 'Free' : `$${tuitionPrice.toLocaleString()}/yr`) : null].filter(Boolean).join(' · ')}
        </p>
      )}
      <div className="flex flex-wrap gap-2 mt-auto">
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
