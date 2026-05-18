import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { Checkbox } from '@/components/ui/Checkbox'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PageTitle } from '@/components/ui/PageTitle'
import { Select } from '@/components/ui/Select'
import { UniversityCard } from '@/components/student/UniversityCard'
import { FIELD_OF_STUDY } from '@/constants/fieldOfStudy'
import { getLocalizedCountryName, getLocalizedLanguageName } from '@/utils/localeDisplay'
import {
  getUniversities,
  showInterest,
  getInterestedUniversityIds,
  getInterestLimit,
  getStudentProfile,
  getStudentUniversityCountries,
  type UniversitiesParams,
} from '@/services/student'
import type { UniversityListItem } from '@/types/university'
import { toastApiError } from '@/utils/toastError'
import { Building2, MapPin, Search, SlidersHorizontal } from 'lucide-react'
import { notifyInfo, notifySuccess } from '@/utils/notify'
import { getAllRegionCodesForFilter } from '@/utils/countryRegionCodes'

type UniversityFilters = {
  search: string
  country: string
  sort: UniversitiesParams['sort']
  facultyCodes: string[]
  degreeLevels: string[]
  programLanguages: string[]
  targetStudentCountries: string[]
  minTuition: string
  maxTuition: string
  minEstablishedYear: string
  maxEstablishedYear: string
  minStudentCount: string
  maxStudentCount: string
  programQuery: string
  requirementsQuery: string
  hasScholarship: boolean
  useProfileFilters: boolean
}

const UNIVERSITIES_PAGE_SIZE = 12

const DEGREE_LEVEL_OPTIONS = ['Bachelor', 'Master', 'PhD', 'Foundation', 'Associate']
const PROGRAM_LANGUAGE_OPTIONS = ['English', 'Russian', 'Uzbek', 'German', 'French', 'Turkish', 'Chinese', 'Arabic']
type TranslateLabel = (key: string, defaultValue?: string) => string

function getDegreeLevelLabel(value: string, t: TranslateLabel): string {
  const normalized = value.toLowerCase()
  if (normalized === 'bachelor') return t('student:degreeBachelor', 'Bachelor')
  if (normalized === 'master') return t('student:degreeMaster', 'Master')
  if (normalized === 'phd') return t('student:degreePhd', 'PhD')
  if (normalized === 'foundation') return t('student:degreeFoundation', 'Foundation')
  if (normalized === 'associate') return t('student:degreeAssociate', 'Associate')
  return value
}

function getSortLabel(value: UniversitiesParams['sort'], t: TranslateLabel): string {
  if (value === 'name') return t('student:compareName', 'Name')
  if (value === 'tuition_asc') return t('student:sortTuitionLow', 'Tuition: low to high')
  if (value === 'tuition_desc') return t('student:sortTuitionHigh', 'Tuition: high to low')
  if (value === 'newest') return t('student:sortNewest', 'Newest first')
  return t('student:sortBestFit', 'Best fit')
}

function createInitialFilters(useProfileFilters = true): UniversityFilters {
  return {
    search: '',
    country: '',
    sort: 'name',
    facultyCodes: [],
    degreeLevels: [],
    programLanguages: [],
    targetStudentCountries: [],
    minTuition: '',
    maxTuition: '',
    minEstablishedYear: '',
    maxEstablishedYear: '',
    minStudentCount: '',
    maxStudentCount: '',
    programQuery: '',
    requirementsQuery: '',
    hasScholarship: false,
    useProfileFilters,
  }
}

function parseSort(value: string | null): UniversitiesParams['sort'] {
  if (value === 'name' || value === 'rating' || value === 'tuition_asc' || value === 'tuition_desc' || value === 'newest') return value
  return 'name'
}

export function ExploreUniversities() {
  const { t, i18n } = useTranslation(['student', 'common', 'university'])
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<UniversityFilters>(() => ({
    ...createInitialFilters(true),
    search: searchParams.get('search') ?? '',
    country: searchParams.get('country') ?? '',
    sort: parseSort(searchParams.get('sort')),
  }))
  const [draftFilters, setDraftFilters] = useState<UniversityFilters>(filters)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const regionCodes = useMemo(() => getAllRegionCodesForFilter(), [])
  const { data: universityCountryCodes = [] } = useQuery({
    queryKey: ['student', 'universityCountries'],
    queryFn: getStudentUniversityCountries,
    staleTime: 5 * 60 * 1000,
  })
  const facultyOptions = useMemo(
    () => FIELD_OF_STUDY.map((item) => ({ code: item.id, label: t(item.titleKey) })),
    [t]
  )
  const countryOptions = useMemo(
    () => {
      const codes = new Set(
        universityCountryCodes
          .map((code) => String(code ?? '').trim())
          .filter(Boolean)
      )
      if (filters.country) codes.add(filters.country)
      if (draftFilters.country) codes.add(draftFilters.country)
      return [
        { value: '', label: t('student:allCountries', 'All countries') },
        ...Array.from(codes)
          .sort((left, right) => getLocalizedCountryName(left, i18n.language).localeCompare(getLocalizedCountryName(right, i18n.language)))
          .map((code) => ({ value: code, label: getLocalizedCountryName(code, i18n.language) })),
      ]
    },
    [draftFilters.country, filters.country, i18n.language, t, universityCountryCodes]
  )
  const degreeLevelOptions = useMemo(
    () => DEGREE_LEVEL_OPTIONS.map((value) => ({ value, label: getDegreeLevelLabel(value, t) })),
    [t]
  )
  const programLanguageOptions = useMemo(
    () => PROGRAM_LANGUAGE_OPTIONS.map((value) => ({ value, label: getLocalizedLanguageName(value, i18n.language) })),
    [i18n.language]
  )
  const targetCountryOptions = useMemo(
    () => regionCodes.map((code) => ({ code, label: getLocalizedCountryName(code, i18n.language) })),
    [i18n.language, regionCodes]
  )
  const sortOptions = useMemo(
    () => [
      { value: 'match', label: t('student:matchScore', 'Match score') },
      { value: 'name', label: t('student:compareName', 'Name') },
      { value: 'tuition_asc', label: t('student:sortTuitionLow', 'Tuition: low to high') },
      { value: 'tuition_desc', label: t('student:sortTuitionHigh', 'Tuition: high to low') },
      { value: 'newest', label: t('student:sortNewest', 'Newest first') },
    ],
    [t]
  )

  const { data: interestedIdsData } = useQuery({
    queryKey: ['student', 'interestedUniversityIds'],
    queryFn: getInterestedUniversityIds,
    staleTime: 2 * 60 * 1000,
  })
  const interestedIds = new Set(interestedIdsData ?? [])
  const { data: studentProfile } = useQuery({
    queryKey: ['student', 'profile', 'exploreGate'],
    queryFn: getStudentProfile,
    staleTime: 60 * 1000,
  })
  const minimalProfileComplete = studentProfile?.minimalPortfolioComplete ?? false

  const { data: interestLimit, isSuccess: interestLimitReady } = useQuery({
    queryKey: ['student', 'interestLimit'],
    queryFn: getInterestLimit,
    staleTime: 60 * 1000,
  })
  const limitInfo = interestLimit ?? { allowed: false, current: 0, limit: 3 }

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['student', 'universities', filters],
    queryFn: ({ pageParam }) => getUniversities(buildUniversitySearchParams(pageParam, UNIVERSITIES_PAGE_SIZE, filters)),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.data.length, 0)
      const serverTotal = lastPage.total
      if (typeof serverTotal === 'number' && Number.isFinite(serverTotal) && loaded >= serverTotal) return undefined
      if (lastPage.data.length < UNIVERSITIES_PAGE_SIZE) return undefined
      return allPages.length + 1
    },
    staleTime: 30 * 1000,
  })

  const list = useMemo(() => {
    const pages = data?.pages ?? []
    const seen = new Set<string>()
    const out: UniversityListItem[] = []
    for (const p of pages) {
      for (const u of p.data) {
        if (seen.has(u.id)) continue
        if (interestedIds.has(u.id)) continue
        seen.add(u.id)
        out.push(u)
      }
    }
    return out
  }, [data, interestedIds])

  const total = typeof data?.pages?.[0]?.total === 'number' && Number.isFinite(data.pages[0].total) ? data.pages[0].total : list.length

  const isInitialUniversitiesLoading = !data && isFetching

  const { data: profileFilterCounts } = useQuery({
    queryKey: ['student', 'profile', 'filterCounts'],
    queryFn: getStudentProfile,
    select: (profile) => ({
      faculties: (profile.interestedFaculties ?? []).filter(Boolean).length,
      countries: (profile.preferredCountries ?? []).filter(Boolean).length,
    }),
  })
  const profileCriteria = profileFilterCounts ?? { faculties: 0, countries: 0 }
  const profileCriteriaCount = profileCriteria.faculties + profileCriteria.countries

  const interestMutation = useMutation({
    mutationFn: showInterest,
    onSuccess: (_, universityId) => {
      queryClient.setQueryData<string[]>(['student', 'interestedUniversityIds'], (previous) =>
        previous ? [...previous, universityId] : [universityId]
      )
      queryClient.invalidateQueries({ queryKey: ['student', 'interestLimit'] })
      notifySuccess(t('student:interestedButton', 'Interested'))
    },
    onError: (err) => {
      toastApiError(err)
      queryClient.invalidateQueries({ queryKey: ['student', 'interestLimit'] })
    },
  })

  useEffect(() => {
    const params: Record<string, string> = {}
    if (filters.search.trim()) params.search = filters.search.trim()
    if (filters.country) params.country = filters.country
    if (filters.sort && filters.sort !== 'match') params.sort = filters.sort
    setSearchParams(params, { replace: true })
  }, [filters.search, filters.country, filters.sort, setSearchParams])

  const filterCount = useMemo(() => countActiveFilters(filters, profileCriteriaCount), [filters, profileCriteriaCount])
  const showClear = filterCount > 0 || !filters.useProfileFilters
  const canShowInterest = interestLimitReady && limitInfo.allowed
  const interestLabel = limitInfo.limit != null ? `${limitInfo.current}/${limitInfo.limit}` : `${limitInfo.current}`
  const interestBlockedText = interestLimitReady && !canShowInterest
    ? limitInfo.trialExpired
      ? t('student:interestTrialExpiredInline', '(trial expired, upgrade to add more)')
      : limitInfo.limit != null && limitInfo.current >= limitInfo.limit
        ? t('student:interestLimitReachedInline', '(limit reached, upgrade to add more)')
        : null
    : null

  const syncQuickFilters = (patch: Partial<UniversityFilters>) => {
    setFilters((current) => ({ ...current, ...patch }))
    setDraftFilters((current) => ({ ...current, ...patch }))
  }

  const openFullFilter = () => {
    setDraftFilters(filters)
    setFilterModalOpen(true)
  }

  const handleApplyFullFilters = () => {
    const normalized = normalizeFilters(draftFilters)
    setDraftFilters(normalized)
    setFilters(normalized)
    if (hasRangeAdjustment(draftFilters, normalized)) {
      notifyInfo(t('student:filtersAdjusted', 'Some range values were adjusted automatically.'))
    }
    setFilterModalOpen(false)
  }

  const handleClearFilters = () => {
    const cleared = createInitialFilters(false)
    setFilters(cleared)
    setDraftFilters(cleared)
    setFilterModalOpen(false)
  }

  const handleInterest = (id: string) => {
    if (interestedIds.has(id) || !interestLimitReady || !limitInfo.allowed) return
    interestMutation.mutate(id)
  }

  const draftFacultyLabels = draftFilters.facultyCodes.map((code) => facultyOptions.find((item) => item.code === code)?.label ?? code)
  const draftDegreeLabels = draftFilters.degreeLevels.map((value) => degreeLevelOptions.find((option) => option.value === value)?.label ?? value)
  const draftProgramLanguageLabels = draftFilters.programLanguages.map(
    (value) => programLanguageOptions.find((option) => option.value === value)?.label ?? value
  )
  const draftTargetCountryLabels = draftFilters.targetStudentCountries.map(
    (code) => targetCountryOptions.find((item) => item.code === code)?.label ?? code
  )
  const hasAnyUniversities = list.length > 0

  return (
    <div className="space-y-5">
      <div data-onboarding="student-universities-overview">
        <PageTitle title={t('student:exploreUniversities', 'Explore universities')} icon="GraduationCap" />
      </div>

      <Card className="space-y-4 overflow-hidden border border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(15,23,42,0.03)_0%,rgba(14,165,233,0.07)_100%)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              {t('student:universityCatalog', 'University catalog')}
            </p>
            <h2 className="text-xl font-semibold text-[var(--color-text)]">
              {t('student:quickUniversityFilters', 'Quick filters for fast discovery')}
            </h2>
          </div>
          <div className="flex flex-col items-end gap-2">
            {limitInfo.limit != null ? (
              <p className="max-w-[min(100%,22rem)] text-right text-xs text-[var(--color-text-muted)] sm:text-sm">
                {t('student:interestUsage', { current: interestLabel, defaultValue: 'Interests used: {{current}}' })}
                {interestBlockedText
                  ? ` ${interestBlockedText}`
                  : null}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Badge variant="default">{filterCount} {t('student:activeFilters', 'active')}</Badge>
              <Badge variant={filters.useProfileFilters ? 'success' : 'default'}>
                {filters.useProfileFilters
                  ? t('student:profileMatchingOn', 'Profile matching on')
                  : t('student:profileMatchingOff', 'Profile matching off')}
              </Badge>
              <Button variant="secondary" size="sm" onClick={openFullFilter} icon={<SlidersHorizontal size={16} />}>
                {t('student:fullFilter', 'Full Filter')}
              </Button>
              <Button to="/student/universities/map" variant="secondary" size="sm" icon={<MapPin size={16} />}>
                {t('student:navMap', 'Map')}
              </Button>
              {showClear ? (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  {t('student:clearFilters', 'Clear filters')}
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Input
            label={t('common:search', 'Search')}
            placeholder={t('student:searchUniversityPlaceholder', 'University name, program, faculty, requirement')}
            value={filters.search}
            onChange={(event) => syncQuickFilters({ search: event.target.value })}
          />
          <Select
            label={t('student:country', 'Country')}
            options={countryOptions}
            value={filters.country}
            onChange={(event) => syncQuickFilters({ country: event.target.value })}
          />
          <Select
            label={t('student:sort', 'Sort')}
            options={sortOptions}
            value={filters.sort ?? 'match'}
            onChange={(event) => syncQuickFilters({ sort: event.target.value as UniversityFilters['sort'] })}
          />
        </div>

        {showClear ? (
          <div className="flex flex-wrap gap-2">
            {buildActiveFilterLabels(filters, t, i18n.language, profileCriteriaCount, profileCriteria).map((label) => (
              <span key={label} className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/85 px-3 py-1 text-xs text-[var(--color-text-muted)]">
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </Card>

      {!minimalProfileComplete ? (
        <Card>
          <EmptyState
            icon={<Building2 className="w-14 h-14 text-[var(--color-text-muted)] opacity-60" />}
            title={t('student:completeMinimalProfileTitle', 'Complete your profile first')}
            description={t('student:completeMinimalProfileDesc', 'Universities will appear after you complete the minimum student profile: name, location, and education history.')}
            actionLabel={t('student:navProfile', 'Profile')}
            actionTo="/student/profile"
          />
        </Card>
      ) : null}

      {minimalProfileComplete && (
      <div className="flex flex-wrap items-center gap-2">
        <Search size={16} className="text-[var(--color-text-muted)]" />
        <p className="text-[var(--color-text-muted)]">
          {!hasAnyUniversities && !isInitialUniversitiesLoading
            ? t('student:noUniversitiesFound', 'No universities found')
            : t('student:universitiesFound', { count: total, defaultValue: '{{count}} universities found' })}
        </p>
      </div>
      )}

      <Modal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        panelClassName="max-w-[min(1200px,96vw)]"
        footerClassName="justify-between"
        title={(
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{t('student:fullFilter', 'Full Filter')}</h2>
            <p className="text-sm font-normal text-[var(--color-text-muted)]">
              {t('student:fullUniversityFilterHint', 'Find a university by name, country, faculty, degree level, program language, tuition, requirements, founding year, student count, scholarships, and target countries.')}
            </p>
          </div>
        )}
        footer={(
          <>
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <span>{countActiveFilters(draftFilters, draftFilters.useProfileFilters ? profileCriteriaCount : 0)} {t('student:activeFilters', 'active')}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleClearFilters}>{t('common:clear', 'Clear')}</Button>
              <Button variant="secondary" onClick={() => setFilterModalOpen(false)}>{t('common:cancel', 'Cancel')}</Button>
              <Button onClick={handleApplyFullFilters}>{t('common:apply', 'Apply')}</Button>
            </div>
          </>
        )}
      >
        <div className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-2">
            <FilterSection
              title={t('student:filterBasics', 'Basics')}
              description={t('student:filterBasicsHint', 'Search by university identity, location, scholarships, and general text match.')}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label={t('common:search', 'Search')}
                  placeholder={t('student:searchUniversityPlaceholder', 'University name, program, faculty, requirement')}
                  value={draftFilters.search}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))}
                />
                <Select
                  label={t('student:country', 'Country')}
                  options={countryOptions}
                  value={draftFilters.country}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, country: event.target.value }))}
                />
                <Select
                  label={t('student:sort', 'Sort')}
                  options={sortOptions}
                  value={draftFilters.sort ?? 'match'}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, sort: event.target.value as UniversityFilters['sort'] }))}
                />
                <Input
                  label={t('student:programQuery', 'Program query')}
                  placeholder={t('student:programQueryPlaceholder', 'Computer science, AI, law, MBA')}
                  value={draftFilters.programQuery}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, programQuery: event.target.value }))}
                />
                <Input
                  label={t('student:requirementsQuery', 'Requirements query')}
                  placeholder={t('student:requirementsQueryPlaceholder', 'IELTS, TOEFL, GPA, portfolio')}
                  value={draftFilters.requirementsQuery}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, requirementsQuery: event.target.value }))}
                />
                <div className="flex items-end">
                  <Checkbox
                    checked={draftFilters.hasScholarship}
                    onChange={(event) => setDraftFilters((current) => ({ ...current, hasScholarship: event.target.checked }))}
                    label={t('student:scholarshipsOnly', 'Scholarships only')}
                  />
                </div>
              </div>
            </FilterSection>

            <FilterSection
              title={t('student:programsAndFaculties', 'Programs and faculties')}
              description={t('student:programsAndFacultiesHint', 'Filter by degree levels, faculty coverage, program languages, and target student regions.')}
            >
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                    {t('student:facultiesLabel', 'Faculties')}
                  </label>
                  <ChipSelect
                    options={facultyOptions.map((item) => item.label)}
                    value={draftFacultyLabels}
                    onChange={(labels) =>
                      setDraftFilters((current) => ({
                        ...current,
                        facultyCodes: labels
                          .map((label) => facultyOptions.find((item) => item.label === label)?.code)
                          .filter((value): value is string => Boolean(value)),
                      }))
                    }
                    max={20}
                    placeholder={t('student:facultyFilterPlaceholder', 'Choose faculties')}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                    {t('student:degreeLevels', 'Degree levels')}
                  </label>
                  <ChipSelect
                    options={degreeLevelOptions.map((option) => option.label)}
                    value={draftDegreeLabels}
                    onChange={(labels) =>
                      setDraftFilters((current) => ({
                        ...current,
                        degreeLevels: labels
                          .map((label) => degreeLevelOptions.find((option) => option.label === label)?.value)
                          .filter((value): value is string => Boolean(value)),
                      }))
                    }
                    max={10}
                    placeholder={t('student:degreeLevelsPlaceholder', 'Choose degree levels')}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                    {t('student:programLanguages', 'Program languages')}
                  </label>
                  <ChipSelect
                    options={programLanguageOptions.map((option) => option.label)}
                    value={draftProgramLanguageLabels}
                    onChange={(labels) =>
                      setDraftFilters((current) => ({
                        ...current,
                        programLanguages: labels
                          .map((label) => programLanguageOptions.find((option) => option.label === label)?.value)
                          .filter((value): value is string => Boolean(value)),
                      }))
                    }
                    max={10}
                    placeholder={t('student:programLanguagesPlaceholder', 'Choose program languages')}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                    {t('university:targetStudentCountries', 'Target student countries')}
                  </label>
                  <ChipSelect
                    options={targetCountryOptions.map((item) => item.label)}
                    value={draftTargetCountryLabels}
                    onChange={(labels) =>
                      setDraftFilters((current) => ({
                        ...current,
                        targetStudentCountries: labels
                          .map((label) => targetCountryOptions.find((item) => item.label === label)?.code)
                          .filter(Boolean)
                          .map(String),
                      }))
                    }
                    max={10}
                    placeholder={t('student:targetCountriesPlaceholder', 'Choose target countries')}
                  />
                </div>
              </div>
            </FilterSection>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <FilterSection
              title={t('student:tuitionAndScale', 'Tuition and scale')}
              description={t('student:tuitionAndScaleHint', 'Narrow by tuition range, founding year, and university size.')}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label={t('student:minTuition', 'Min tuition')}
                  type="number"
                  min={0}
                  step={100}
                  placeholder="5000"
                  value={draftFilters.minTuition}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, minTuition: event.target.value }))}
                />
                <Input
                  label={t('student:maxTuition', 'Max tuition')}
                  type="number"
                  min={0}
                  step={100}
                  placeholder="50000"
                  value={draftFilters.maxTuition}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, maxTuition: event.target.value }))}
                />
                <Input
                  label={t('student:foundedYearFrom', 'Founded year from')}
                  type="number"
                  min={1000}
                  max={2100}
                  value={draftFilters.minEstablishedYear}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, minEstablishedYear: event.target.value }))}
                />
                <Input
                  label={t('student:foundedYearTo', 'Founded year to')}
                  type="number"
                  min={1000}
                  max={2100}
                  value={draftFilters.maxEstablishedYear}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, maxEstablishedYear: event.target.value }))}
                />
                <Input
                  label={t('student:studentCountFrom', 'Student count from')}
                  type="number"
                  min={0}
                  step={100}
                  value={draftFilters.minStudentCount}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, minStudentCount: event.target.value }))}
                />
                <Input
                  label={t('student:studentCountTo', 'Student count to')}
                  type="number"
                  min={0}
                  step={100}
                  value={draftFilters.maxStudentCount}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, maxStudentCount: event.target.value }))}
                />
              </div>
            </FilterSection>

            <FilterSection
              title={t('student:matchingScope', 'Matching scope')}
              description={t('student:matchingScopeHint', 'Choose whether to keep your profile defaults as an extra filter layer.')}
            >
              <div className="space-y-4">
                <Checkbox
                  checked={draftFilters.useProfileFilters}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, useProfileFilters: event.target.checked }))}
                  label={t('student:alsoApplyProfileDefaults', 'Also apply my profile defaults')}
                />
                <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-card)]/80 p-4 text-sm text-[var(--color-text-muted)]">
                  {t('student:profileDefaultsHint', 'When enabled, the catalog also respects your preferred countries and interested faculties unless you explicitly override them in the filters above.')}
                </div>
              </div>
            </FilterSection>
          </div>
        </div>
      </Modal>

      {!minimalProfileComplete ? null : isInitialUniversitiesLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : !hasAnyUniversities ? (
        <Card>
          <EmptyState
            icon={<Building2 className="w-14 h-14 text-[var(--color-text-muted)] opacity-60" />}
            title={t('student:noUniversitiesFound', 'No universities found')}
            description={t('student:tryChangingFiltersOrSearch', 'Try changing filters or search to see more results.')}
            actionLabel={t('student:clearFilters', 'Clear filters')}
            onAction={handleClearFilters}
          />
        </Card>
      ) : (
        <>
          {list.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {list.map((university, index) => (
                <div
                  key={university.id}
                  className="animate-card-enter opacity-0"
                  style={{ animationDelay: `${Math.min(index, 9) * 0.05}s`, animationFillMode: 'forwards' }}
                >
                  <UniversityCard university={university} onInterest={handleInterest} interested={interestedIds.has(university.id)} interestDisabled={!canShowInterest} />
                </div>
              ))}
            </div>
          ) : null}

          {hasNextPage ? (
            <div className="mt-8 flex justify-center">
              <Button
                variant="secondary"
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                loading={isFetchingNextPage}
              >
                {isFetchingNextPage
                  ? t('common:loadingMoreUniversities', 'Loading…')
                  : t('common:loadMoreUniversities', 'Show more')}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

function FilterSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.92))] dark:bg-[linear-gradient(180deg,rgba(17,24,39,0.96),rgba(15,23,42,0.94))] p-4 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.5)]">
      <div className="mb-4 space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-[var(--color-text-muted)]">{description}</p>
      </div>
      {children}
    </section>
  )
}

function buildUniversitySearchParams(page: number, limit: number, filters: UniversityFilters): UniversitiesParams {
  return {
    page,
    limit,
    search: filters.search.trim() || undefined,
    country: filters.country || undefined,
    sort: filters.sort || 'match',
    facultyCodes: filters.facultyCodes.length ? filters.facultyCodes : undefined,
    degreeLevels: filters.degreeLevels.length ? filters.degreeLevels : undefined,
    programLanguages: filters.programLanguages.length ? filters.programLanguages : undefined,
    targetStudentCountries: filters.targetStudentCountries.length ? filters.targetStudentCountries : undefined,
    minTuition: filters.minTuition.trim() ? Number(filters.minTuition) : undefined,
    maxTuition: filters.maxTuition.trim() ? Number(filters.maxTuition) : undefined,
    minEstablishedYear: filters.minEstablishedYear.trim() ? Number(filters.minEstablishedYear) : undefined,
    maxEstablishedYear: filters.maxEstablishedYear.trim() ? Number(filters.maxEstablishedYear) : undefined,
    minStudentCount: filters.minStudentCount.trim() ? Number(filters.minStudentCount) : undefined,
    maxStudentCount: filters.maxStudentCount.trim() ? Number(filters.maxStudentCount) : undefined,
    programQuery: filters.programQuery.trim() || undefined,
    requirementsQuery: filters.requirementsQuery.trim() || undefined,
    hasScholarship: filters.hasScholarship || undefined,
    useProfileFilters: filters.useProfileFilters,
  }
}

function normalizeFilters(filters: UniversityFilters): UniversityFilters {
  const next = { ...filters }
  ;[
    ['minTuition', 'maxTuition'],
    ['minEstablishedYear', 'maxEstablishedYear'],
    ['minStudentCount', 'maxStudentCount'],
  ].forEach(([minKey, maxKey]) => {
    const minRaw = next[minKey as keyof UniversityFilters]
    const maxRaw = next[maxKey as keyof UniversityFilters]
    const min = String(minRaw ?? '').trim()
    const max = String(maxRaw ?? '').trim()
    if (!min || !max) return
    const minNumber = Number(min)
    const maxNumber = Number(max)
    if (!Number.isFinite(minNumber) || !Number.isFinite(maxNumber)) return
    if (minNumber > maxNumber) {
      next[minKey as keyof UniversityFilters] = String(maxNumber) as never
      next[maxKey as keyof UniversityFilters] = String(minNumber) as never
    }
  })
  return next
}

function hasRangeAdjustment(before: UniversityFilters, after: UniversityFilters): boolean {
  return (
    before.minTuition !== after.minTuition ||
    before.maxTuition !== after.maxTuition ||
    before.minEstablishedYear !== after.minEstablishedYear ||
    before.maxEstablishedYear !== after.maxEstablishedYear ||
    before.minStudentCount !== after.minStudentCount ||
    before.maxStudentCount !== after.maxStudentCount
  )
}

function countActiveFilters(filters: UniversityFilters, profileCriteriaCount = 0) {
  return [
    filters.search.trim(),
    filters.country,
    filters.facultyCodes.length,
    filters.degreeLevels.length,
    filters.programLanguages.length,
    filters.targetStudentCountries.length,
    filters.minTuition.trim(),
    filters.maxTuition.trim(),
    filters.minEstablishedYear.trim(),
    filters.maxEstablishedYear.trim(),
    filters.minStudentCount.trim(),
    filters.maxStudentCount.trim(),
    filters.programQuery.trim(),
    filters.requirementsQuery.trim(),
    filters.hasScholarship,
    filters.useProfileFilters ? profileCriteriaCount : 0,
  ].filter((value) => (typeof value === 'number' ? value > 0 : Boolean(value))).length
}

function buildActiveFilterLabels(
  filters: UniversityFilters,
  t: TranslateLabel,
  locale: string,
  profileCriteriaCount = 0,
  profileCriteria?: { faculties: number; countries: number }
) {
  const labels: string[] = []
  if (filters.search.trim()) labels.push(`${t('common:search', 'Search')}: ${filters.search.trim()}`)
  if (filters.country) labels.push(`${t('student:country', 'Country')}: ${getLocalizedCountryName(filters.country, locale)}`)
  if (filters.sort && filters.sort !== 'match') labels.push(`${t('student:sort', 'Sort')}: ${getSortLabel(filters.sort, t)}`)
  if (filters.facultyCodes.length) labels.push(`${t('student:facultiesLabel', 'Faculties')}: ${filters.facultyCodes.length}`)
  if (filters.degreeLevels.length) labels.push(`${t('student:degreeLevels', 'Degree levels')}: ${filters.degreeLevels.map((value) => getDegreeLevelLabel(value, t)).join(', ')}`)
  if (filters.programLanguages.length) labels.push(`${t('student:programLanguages', 'Program languages')}: ${filters.programLanguages.map((value) => getLocalizedLanguageName(value, locale)).join(', ')}`)
  if (filters.minTuition.trim() || filters.maxTuition.trim()) {
    labels.push(`${t('student:tuitionLabel', 'Tuition')}: ${filters.minTuition.trim() || '0'}-${filters.maxTuition.trim() || 'max'}`)
  }
  if (filters.programQuery.trim()) labels.push(`${t('student:programQuery', 'Program query')}: ${filters.programQuery.trim()}`)
  if (filters.requirementsQuery.trim()) labels.push(`${t('student:requirementsQuery', 'Requirements query')}: ${filters.requirementsQuery.trim()}`)
  if (filters.hasScholarship) labels.push(t('student:scholarshipsOnly', 'Scholarships only'))
  if (filters.useProfileFilters && profileCriteriaCount > 0) {
    labels.push(
      t('student:profileFiltersApplied', 'Using your profile') +
      `: ${profileCriteria?.faculties ?? 0} ${t('student:faculties', 'faculties')}, ${profileCriteria?.countries ?? 0} ${t('student:countries', 'countries')}`
    )
  }
  if (!filters.useProfileFilters) labels.push(t('student:profileMatchingOff', 'Profile matching off'))
  return labels.slice(0, 10)
}
