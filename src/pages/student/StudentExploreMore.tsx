import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageTitle } from '@/components/ui/PageTitle'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { UniversityCard } from '@/components/student/UniversityCard'
import { getUniversities } from '@/services/student'
import type { UniversityListItem } from '@/types/university'
import { toastApiError } from '@/utils/toastError'

const PAGE_SIZE = 8

function mergeUniqueUniversities(
  current: UniversityListItem[],
  incoming: UniversityListItem[]
): UniversityListItem[] {
  if (current.length === 0) return incoming
  const seen = new Set(current.map((item) => item.id))
  const next = [...current]
  for (const item of incoming) {
    if (!seen.has(item.id)) {
      seen.add(item.id)
      next.push(item)
    }
  }
  return next
}

export function StudentExploreMore() {
  const { t } = useTranslation(['student', 'common'])
  const [universities, setUniversities] = useState<UniversityListItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadPage = (targetPage: number, mode: 'replace' | 'append') => {
    if (mode === 'replace') setLoading(true)
    else setLoadingMore(true)

    getUniversities({
      page: targetPage,
      limit: PAGE_SIZE,
      useProfileFilters: false,
    })
      .then((res) => {
        const list = res.data ?? []
        setTotal(res.total ?? 0)
        setPage(res.page ?? targetPage)
        setUniversities((prev) => (mode === 'append' ? mergeUniqueUniversities(prev, list) : list))
      })
      .catch((error) => {
        toastApiError(error)
        if (mode === 'replace') {
          setUniversities([])
          setTotal(0)
          setPage(1)
        }
      })
      .finally(() => {
        if (mode === 'replace') setLoading(false)
        else setLoadingMore(false)
      })
  }

  useEffect(() => {
    loadPage(1, 'replace')
  }, [])

  const hasMore = useMemo(() => {
    if (!Number.isFinite(total) || total <= 0) return false
    return universities.length < total
  }, [total, universities.length])

  return (
    <div className="space-y-5">
      <PageTitle title={t('student:dashboardExploreMiniCta', 'Explore more')} icon="Compass" />

      <p className="text-sm text-[var(--color-text-muted)]">
        {t(
          'student:dashboardExploreMiniHint',
          'Explore more universities from the full catalog without profile-based filters.'
        )}
      </p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : universities.length === 0 ? (
        <EmptyState
          title={t('student:noUniversitiesFound', 'No universities found')}
          description={t(
            'student:dashboardExploreMiniEmpty',
            'There are no universities in the catalog yet.'
          )}
          actionLabel={t('homePrimaryCtaExplore', 'Explore universities')}
          actionTo="/student/universities"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {universities.map((university) => (
              <UniversityCard key={university.id} university={university} />
            ))}
          </div>

          {hasMore ? (
            <div className="flex justify-center pt-2">
              <Button
                variant="secondary"
                onClick={() => loadPage(page + 1, 'append')}
                loading={loadingMore}
                disabled={loadingMore}
              >
                {t('student:viewMoreUniversities', 'View more')}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

