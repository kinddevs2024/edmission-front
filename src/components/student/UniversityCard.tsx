import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getImageUrl } from '@/services/upload'
import { useDominantColor } from '@/hooks/useDominantColor'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'
import { useTranslation } from 'react-i18next'
import { getLocalizedCountryName } from '@/utils/localeDisplay'
import type { UniversityListItem } from '@/types/university'
import { Star } from 'lucide-react'

interface UniversityCardProps {
  university: UniversityListItem
  showMatch?: boolean
  /** When false, min language level and tuition are hidden (e.g. dashboard recommendations). */
  showRequirements?: boolean
  onInterest?: (id: string) => void
  interested?: boolean
  interestDisabled?: boolean
  detailsTo?: string
}

export function UniversityCard({
  university,
  showRequirements = true,
  onInterest,
  interested,
  interestDisabled,
  detailsTo,
}: UniversityCardProps) {
  const { t, i18n } = useTranslation(['student', 'common'])
  const {
    id,
    name,
    logo,
    country,
    city,
    description,
    rating,
    hasScholarship,
    scholarships,
    minLanguageLevel,
    tuitionPrice,
  } = university

  const scholarshipCoverageMax = Array.isArray(scholarships)
    ? scholarships.reduce((max, s) => {
        const p = typeof s?.coveragePercent === 'number' ? s.coveragePercent : 0
        return Math.max(max, p)
      }, 0)
    : 0

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
        {null}
      </div>
      <div className="mb-3 grid grid-cols-1 gap-2 rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-bg)]/50 px-3 py-2.5 text-xs sm:grid-cols-3">
        <div>
          <p className="font-medium text-[var(--color-text)]">{t('student:compareRating', 'Rating')}</p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[var(--color-text-muted)] tabular-nums">
            {rating != null && Number.isFinite(rating) ? (
              <>
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-hidden />
                {Number(rating).toFixed(1)}
              </>
            ) : '—'}
          </p>
        </div>
        <div>
          <p className="font-medium text-[var(--color-text)]">{t('student:cardTuitionLabel', 'Tuition')}</p>
          <p className="mt-0.5 text-[var(--color-text-muted)]">
            {tuitionPrice != null ? (tuitionPrice === 0 ? t('student:cardTuitionFree', 'Tuition-free') : `$${tuitionPrice.toLocaleString()}/yr`) : '—'}
          </p>
        </div>
        <div>
          <p className="font-medium text-[var(--color-text)]">{t('student:compareScholarship', 'Scholarship')}</p>
          <p className="mt-0.5 text-[var(--color-text-muted)]">
            {hasScholarship
              ? scholarshipCoverageMax > 0
                ? t('student:cardScholarshipUpTo', 'Up to {{pct}}%', { pct: Math.round(scholarshipCoverageMax) })
                : t('student:cardScholarshipAvailable', 'Available')
              : '—'}
          </p>
        </div>
      </div>

      {description ? (
        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{description}</p>
      ) : null}

      {showRequirements && minLanguageLevel ? (
        <p className="mb-2 text-xs text-[var(--color-text-muted)]">{minLanguageLevel}</p>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <div className="ml-auto flex gap-2">
          {onInterest ? (
            <Button
              variant={interested ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => onInterest(id)}
              disabled={interested || interestDisabled}
            >
              {interested ? t('student:interestedButton', 'Interested') : t('student:showInterest', 'Interest')}
            </Button>
          ) : null}
          <Button to={detailsTo ?? `/student/universities/${id}`} variant="ghost" size="sm">
            {t('common:details', 'Details')}
          </Button>
        </div>
      </div>
    </Card>
  )
}
