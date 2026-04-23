import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Building2, Compass } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { UniversityCard } from '@/components/student/UniversityCard'
import { getPublicUniversities } from '@/services/public'
import type { UniversityListItem } from '@/types/university'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

const PREVIEW_LIMIT = 6

function uniqueById(items: UniversityListItem[]): UniversityListItem[] {
  const seen = new Set<string>()
  const out: UniversityListItem[] = []
  for (const item of items) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    out.push(item)
  }
  return out
}

export function ExploreSection() {
  const { t } = useTranslation('landing')
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['public', 'landing-explore-preview', PREVIEW_LIMIT],
    queryFn: () => getPublicUniversities({ page: 1, limit: PREVIEW_LIMIT }),
    staleTime: 60_000,
  })
  const universities = useMemo(() => uniqueById(data?.data ?? []), [data?.data])

  return (
    <section
      id="explore"
      className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-card)]/35 scroll-mt-24 lg:scroll-mt-28"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-16 top-8 h-48 w-48 rounded-full bg-primary-accent/14 blur-3xl" />
        <div className="absolute right-0 top-2 h-56 w-56 rounded-full bg-sky-500/12 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-14 md:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow={t('explore.eyebrow', 'Explore')}
            title={t('explore.title', 'See more universities')}
            description={t(
              'explore.description',
              'Open the full university catalog with no profile filters.'
            )}
            actions={(
              <>
                <Button to="/explore" size="lg" icon={<Compass />}>
                  {t('explore.primaryCta', 'Explore more')}
                </Button>
                <Button to="/register" variant="secondary" size="lg">
                  {t('explore.secondaryCta', 'Create account')}
                </Button>
              </>
            )}
          />
        </Reveal>

        {isLoading ? (
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : universities.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={<Building2 className="h-10 w-10 text-[var(--color-text-muted)]" />}
              title={t('student:noUniversitiesFound', 'No universities found')}
              description={t(
                'student:dashboardExploreMiniEmpty',
                'There are no universities in the catalog yet.'
              )}
              actionLabel={t('explore.secondaryCta', 'Create account')}
              actionTo="/register"
            />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {universities.map((university) => (
              <Reveal key={university.id}>
                <UniversityCard
                  university={university}
                  onInterest={() => navigate('/register')}
                />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
