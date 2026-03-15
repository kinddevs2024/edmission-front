import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { UniversityCard } from '@/components/student/UniversityCard'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { Building2, SlidersHorizontal } from 'lucide-react'
import { getUniversities, showInterest, getInterestedUniversityIds, getInterestLimit, getStudentProfile } from '@/services/student'
import { toastApiError } from '@/utils/toastError'

export function ExploreUniversities() {
  const { t, i18n } = useTranslation('student')
  const [searchParams, setSearchParams] = useSearchParams()
  const [country, setCountry] = useState(searchParams.get('country') ?? '')
  const [city, setCity] = useState(searchParams.get('city') ?? '')
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'match')
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  /** When true, backend does not filter by profile (interestedFaculties, preferredCountries). Set by Clear. */
  const [useProfileFilters, setUseProfileFilters] = useState(true)
  const queryClient = useQueryClient()

  const { data: interestedIdsData } = useQuery({
    queryKey: ['student', 'interestedUniversityIds'],
    queryFn: getInterestedUniversityIds,
    staleTime: 2 * 60 * 1000,
  })
  const interestedIds = new Set(interestedIdsData ?? [])

  const { data: interestLimit } = useQuery({
    queryKey: ['student', 'interestLimit'],
    queryFn: getInterestLimit,
    staleTime: 60 * 1000,
  })
  const limit = interestLimit ?? { allowed: true, current: 0, limit: 3 }

  const { data: universitiesData, isLoading: loading } = useQuery({
    queryKey: ['student', 'universities', page, country, city, sort, useProfileFilters],
    queryFn: () => getUniversities({
      page,
      limit: 12,
      country: country || undefined,
      city: city.trim() || undefined,
      sort: sort as 'match' | 'name' | 'rating',
      useProfileFilters,
    }),
    staleTime: 30 * 1000,
  })
  const list = universitiesData?.data ?? []
  const total = universitiesData?.total ?? 0
  const limitSize = 12

  const { data: profileFilterCounts } = useQuery({
    queryKey: ['student', 'profile', 'filterCounts'],
    queryFn: getStudentProfile,
    select: (p) => ({
      faculties: (p.interestedFaculties ?? []).filter(Boolean).length,
      countries: (p.preferredCountries ?? []).filter(Boolean).length,
    }),
  })
  const profileCriteria = profileFilterCounts ?? { faculties: 0, countries: 0 }

  const interestMutation = useMutation({
    mutationFn: showInterest,
    onSuccess: (_, universityId) => {
      queryClient.setQueryData<string[]>(['student', 'interestedUniversityIds'], (prev) =>
        prev ? [...prev, universityId] : [universityId]
      )
      queryClient.invalidateQueries({ queryKey: ['student', 'interestLimit'] })
    },
    onError: toastApiError,
  })

  useEffect(() => {
    const params: Record<string, string> = {}
    if (country) params.country = country
    if (city) params.city = city
    if (sort) params.sort = sort
    if (page > 1) params.page = String(page)
    setSearchParams(params, { replace: true })
  }, [country, city, sort, page, setSearchParams])

  const handleInterest = (id: string) => {
    if (interestedIds.has(id) || !limit.allowed) return
    interestMutation.mutate(id)
  }

  const canShowInterest = limit.allowed
  const interestLabel = limit.limit != null ? `${limit.current}/${limit.limit}` : `${limit.current}`

  const totalPages = Math.max(1, Math.ceil(total / limitSize))
  const hasFilters = country !== '' || city.trim() !== '' || sort !== 'match' || useProfileFilters
  const profileCriteriaCount = profileCriteria.faculties + profileCriteria.countries
  const isRu = i18n.resolvedLanguage?.startsWith('ru')
  const isUz = i18n.resolvedLanguage?.startsWith('uz')
  const localized = {
    filtersTitle: isRu ? 'Фильтры' : isUz ? 'Filtrlar' : 'Filters',
    refineUniversityList: isRu
      ? 'Уточните список по релевантности, стране и городу.'
      : isUz
        ? "Ro'yxatni moslik, mamlakat va shahar bo'yicha aniqlashtiring."
        : 'Refine the list by relevance, location, and city.',
    sortByName: isRu ? 'Название' : isUz ? 'Nomi' : 'Name',
    sortByRating: isRu ? 'Рейтинг' : isUz ? 'Reyting' : 'Rating',
    enterCity: isRu ? 'Введите город' : isUz ? 'Shaharni kiriting' : 'Enter city',
    countryUsa: isRu ? 'США' : isUz ? 'AQSH' : 'USA',
    countryUk: isRu ? 'Великобритания' : isUz ? 'Buyuk Britaniya' : 'UK',
    countryGermany: isRu ? 'Германия' : isUz ? 'Germaniya' : 'Germany',
    countryNetherlands: isRu ? 'Нидерланды' : isUz ? 'Niderlandiya' : 'Netherlands',
  }
  const countryOptions = [
    { value: '', label: t('allCountries') },
    { value: 'USA', label: localized.countryUsa },
    { value: 'UK', label: localized.countryUk },
    { value: 'Germany', label: localized.countryGermany },
    { value: 'Netherlands', label: localized.countryNetherlands },
  ]
  const sortOptions = [
    { value: 'match', label: t('matchScore') },
    { value: 'name', label: localized.sortByName },
    { value: 'rating', label: localized.sortByRating },
  ]

  const handleClearFilters = () => {
    setCountry('')
    setCity('')
    setSort('match')
    setPage(1)
    setUseProfileFilters(false)
  }

  const handleFilterChange = () => {
    setPage(1)
    setUseProfileFilters(true)
  }

  return (
    <div className="space-y-4">
      <PageTitle title={t('exploreUniversities')} icon="GraduationCap" />

      <section className="rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,250,252,0.82))] p-4 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur dark:bg-[linear-gradient(135deg,rgba(17,24,39,0.95),rgba(15,23,42,0.82))]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-primary-accent)]/12 text-[var(--color-primary-accent)]">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">
                {localized.filtersTitle}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {localized.refineUniversityList}
              </p>
            </div>
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="self-start rounded-2xl px-4 lg:self-auto">
              {t('clearFilters')}
            </Button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)]">
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)]/88 p-3 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.55)]">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              {t('sort')}
            </p>
            <Select
              options={sortOptions}
              value={sort}
              onChange={(e) => { setSort(e.target.value); handleFilterChange() }}
              className="min-h-[46px] rounded-2xl border-none !text-sm !font-medium text-[var(--color-text)]"
            />
          </div>

          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)]/88 p-3 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.55)]">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              {t('country')}
            </p>
            <Select
              options={countryOptions}
              value={country}
              onChange={(e) => { setCountry(e.target.value); handleFilterChange() }}
              className="min-h-[46px] rounded-2xl border-none !text-sm !font-medium text-[var(--color-text)]"
            />
          </div>

          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)]/88 p-3 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.55)]">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              {t('city')}
            </p>
            <Input
              placeholder={localized.enterCity}
              value={city}
              onChange={(e) => { setCity(e.target.value); handleFilterChange() }}
              className="min-h-[46px] rounded-2xl border-none bg-[var(--color-bg)] px-4 text-sm"
            />
          </div>
        </div>
      </section>

      {useProfileFilters && profileCriteriaCount > 0 && (
        <p className="text-sm text-[var(--color-text-muted)]">
          {t('profileFiltersApplied', 'Using your profile')}: {profileCriteria.faculties} {t('faculties', 'faculties')}, {profileCriteria.countries} {t('countries', 'countries')} ({profileCriteriaCount} {t('criteriaTotal', 'criteria total')})
        </p>
      )}

      {limit.limit != null && (
        <p className="text-sm text-[var(--color-text-muted)]">
          Interests used: {interestLabel} {!canShowInterest && limit.limit != null && interestedIds.size >= limit.limit && '(limit reached — upgrade to add more)'}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Building2 className="w-14 h-14 text-[var(--color-text-muted)] opacity-60" />}
            title={t('noUniversitiesFound')}
            description={t('tryChangingFiltersOrSearch')}
            actionLabel={t('clearFilters')}
            onAction={handleClearFilters}
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((u, index) => (
              <div
                key={u.id}
                className="animate-card-enter opacity-0"
                style={{ animationDelay: `${Math.min(index, 9) * 0.05}s`, animationFillMode: 'forwards' }}
              >
                <UniversityCard
                  university={u}
                  showMatch
                  onInterest={handleInterest}
                  interested={interestedIds.has(u.id)}
                  interestDisabled={!canShowInterest}
                />
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                Previous
              </Button>
              <span className="py-2 px-4 text-sm text-[var(--color-text-muted)]">
                Page {page} of {totalPages}
              </span>
              <Button variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
