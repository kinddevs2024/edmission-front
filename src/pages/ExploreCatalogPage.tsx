import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { UniversityCard } from '@/components/student/UniversityCard'
import { LandingHeader } from '@/components/sections/landing/LandingHeader'
import { Button } from '@/components/ui/Button'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { getPublicUniversities } from '@/services/public'
import type { UniversityListItem } from '@/types/university'

const PAGE_SIZE = 8

function mergeUniqueUniversities(
  pages: Array<{ data: UniversityListItem[] }>
): UniversityListItem[] {
  const seen = new Set<string>()
  const out: UniversityListItem[] = []
  for (const page of pages) {
    for (const item of page.data ?? []) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      out.push(item)
    }
  }
  return out
}

export function ExploreCatalogPage() {
  const { t } = useTranslation(['landing', 'common', 'student'])
  const navigate = useNavigate()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['public', 'explore-catalog', PAGE_SIZE],
    queryFn: ({ pageParam }) => getPublicUniversities({ page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + (page.data?.length ?? 0), 0)
      const total = typeof lastPage.total === 'number' ? lastPage.total : 0
      return loaded < total ? allPages.length + 1 : undefined
    },
    staleTime: 60_000,
  })

  const universities = useMemo(
    () => mergeUniqueUniversities(data?.pages ?? []),
    [data?.pages]
  )
  const total = data?.pages?.[0]?.total ?? universities.length

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pt-16 text-[var(--color-text)] safe-area-pb">
      <LandingHeader />

      <section id="explore" className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <p className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          {t('landing:explore.eyebrow', 'Explore')}
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">
          {t('landing:explore.title', 'See more universities')}
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--color-text-muted)]">
          {t(
            'landing:explore.description',
            'Open the full university catalog with no profile filters.'
          )}
        </p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          {t('student:universitiesFound', {
            count: total,
            defaultValue: '{{count}} universities found',
          })}
        </p>

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
              actionLabel={t('landing:explore.secondaryCta', 'Create account')}
              actionTo="/register"
            />
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {universities.map((university) => (
                <UniversityCard
                  key={university.id}
                  university={university}
                  onInterest={() => navigate('/register')}
                />
              ))}
            </div>

            {hasNextPage ? (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="secondary"
                  onClick={() => fetchNextPage()}
                  loading={isFetchingNextPage}
                  disabled={isFetchingNextPage}
                >
                  {t('common:loadMoreUniversities', 'Show more')}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </main>
  )
}

