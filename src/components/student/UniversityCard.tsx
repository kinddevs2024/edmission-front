import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MatchScore } from './MatchScore'
import { getImageUrl } from '@/services/upload'
import { useDominantColor } from '@/hooks/useDominantColor'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'
import { getLocalizedCountryName } from '@/utils/localeDisplay'
import type { UniversityListItem } from '@/types/university'

interface UniversityCardProps {
  university: UniversityListItem
  showMatch?: boolean
  showRequirements?: boolean
  onInterest?: (id: string) => void
  interested?: boolean
  interestDisabled?: boolean
}

export function UniversityCard({
  university,
  showMatch = true,
  showRequirements = true,
  onInterest,
  interested,
  interestDisabled,
}: UniversityCardProps) {
  const { t, i18n } = useTranslation(['student', 'common'])
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
  const isDarkTheme = useUIStore((state) => state.theme === 'dark')
  const shadowColor = dominantColor ?? '#22c55e'
  const localizedCountry = country ? getLocalizedCountryName(country, i18n.language) : ''
  const cardStyle = {
    ...(dominantColor
      ? {
          background: isDarkTheme
            ? `linear-gradient(180deg, ${dominantColor}2d 0%, ${dominantColor}1d 28%, ${dominantColor}12 58%, rgba(7, 12, 14, 0.94) 100%)`
            : `linear-gradient(180deg, ${dominantColor}22 0%, ${dominantColor}14 20%, ${dominantColor}0a 45%, #f2f9f2 100%)`,
        }
      : {}),
    boxShadow: `0 10px 30px -8px ${shadowColor}40, 0 4px 12px -4px ${shadowColor}28`,
  }

  return (
    <Card
      className={cn(
        'relative flex h-full flex-col overflow-hidden transition-all duration-300',
        !dominantColor && 'university-card-bg'
      )}
      style={cardStyle}
      interactive
      tilt
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          {logo ? (
            <div
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-card border border-[var(--color-border)]/50 p-1 shadow-sm sm:h-16 sm:w-16"
              style={{ backgroundColor: isDarkTheme ? 'rgba(9, 15, 20, 0.78)' : 'rgba(255, 255, 255, 0.8)' }}
            >
              <img src={logoUrl!} alt="" loading="lazy" className="h-full w-full object-contain" />
            </div>
          ) : (
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-card bg-[var(--color-border)]/50 sm:h-16 sm:w-16">
              <span className="text-2xl text-[var(--color-text-muted)]" aria-hidden>{'\u{1F3DB}'}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base leading-tight sm:text-lg">{name}</CardTitle>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
              {[localizedCountry, city].filter(Boolean).join(' · ') || '—'}
            </p>
          </div>
        </div>
        {showMatch && matchScore != null ? (
          <MatchScore score={matchScore} breakdown={matchBreakdown} variant="badge" size="sm" />
        ) : null}
      </div>

      {description ? (
        <p className="mb-4 flex-1 line-clamp-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{description}</p>
      ) : null}

      {showRequirements && (minLanguageLevel || tuitionPrice != null) ? (
        <p className="mb-3 text-xs text-[var(--color-text-muted)]">
          {[
            minLanguageLevel,
            tuitionPrice != null ? (tuitionPrice === 0 ? t('common:free', 'Free') : `$${tuitionPrice.toLocaleString()}/yr`) : null,
          ].filter(Boolean).join(' · ')}
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {hasScholarship ? <Badge variant="success">{t('student:compareScholarship', 'Scholarship')}</Badge> : null}
        <div className="ml-auto flex gap-2">
          {onInterest ? (
            <Button
              variant={interested ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => onInterest(id)}
              disabled={interested || interestDisabled}
            >
              {interested ? t('student:interestedButton', 'Interested') : t('student:showInterest', 'Show interest')}
            </Button>
          ) : null}
          <Button to={`/student/universities/${id}`} variant="ghost" size="sm">
            {t('common:details', 'Details')}
          </Button>
        </div>
      </div>
    </Card>
  )
}
