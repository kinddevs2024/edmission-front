import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { getUniversities, showInterest, getInterestedUniversityIds, getInterestLimit, getStudentProfile, type UniversitiesParams } from '@/services/student'
import { toastApiError } from '@/utils/toastError'
import { Building2, Search, SlidersHorizontal } from 'lucide-react'

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

const COUNTRY_VALUES = ['USA', 'UK', 'Germany', 'Netherlands', 'Uzbekistan', 'Russia', 'Kazakhstan', 'Turkey', 'Canada', 'Australia']
const TARGET_COUNTRY_OPTIONS = [
  { code: 'UZ', label: 'Uzbekistan' },
  { code: 'KZ', label: 'Kazakhstan' },
  { code: 'TJ', label: 'Tajikistan' },
  { code: 'KG', label: 'Kyrgyzstan' },
  { code: 'TM', label: 'Turkmenistan' },
  { code: 'TR', label: 'Turkey' },
  { code: 'AE', label: 'UAE' },
  { code: 'CN', label: 'China' },
] as const
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
  return t('student:matchScore', 'Match score')
}

function createInitialFilters(useProfileFilters = true): UniversityFilters {
  return {
    search: '',
    country: '',
    sort: 'match',
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
  return 'match'
}

export function ExploreUniversities() {
  const { t, i18n } = useTranslation(['student', 'common', 'university'])
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [filters, setFilters] = useState<UniversityFilters>(() => ({
    ...createInitialFilters(true),
    search: searchParams.get('search') ?? '',
    country: searchParams.get('country') ?? '',
    sort: parseSort(searchParams.get('sort')),
  }))
  const [draftFilters, setDraftFilters] = useState<UniversityFilters>(filters)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const facultyOptions = useMemo(
    () => FIELD_OF_STUDY.map((item) => ({ code: item.id, label: t(item.titleKey) })),
    [t]
  )
  const countryOptions = useMemo(
    () => [
      { value: '', label: t('student:allCountries', 'All countries') },
      ...COUNTRY_VALUES.map((country) => ({ value: country, label: getLocalizedCountryName(country, i18n.language) })),
    ],
    [i18n.language, t]
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
    () => TARGET_COUNTRY_OPTIONS.map((item) => ({ ...item, label: getLocalizedCountryName(item.code, i18n.language) })),
    [i18n.language]
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

  const { data: interestLimit } = useQuery({
    queryKey: ['student', 'interestLimit'],
    queryFn: getInterestLimit,
    staleTime: 60 * 1000,
  })
  const limitInfo = interestLimit ?? { allowed: true, current: 0, limit: 3 }

  const { data: universitiesData, isLoading: loading } = useQuery({
    queryKey: ['student', 'universities', page, filters],
    queryFn: () => getUniversities(buildUniversitySearchParams(page, 12, filters)),
    staleTime: 30 * 1000,
  })
  const list = universitiesData?.data ?? []
  const total = universitiesData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / 12))

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
    },
    onError: toastApiError,
  })

  useEffect(() => {
    const params: Record<string, string> = {}
    if (filters.search.trim()) params.search = filters.search.trim()
    if (filters.country) params.country = filters.country
    if (filters.sort && filters.sort !== 'match') params.sort = filters.sort
    if (page > 1) params.page = String(page)
    setSearchParams(params, { replace: true })
  }, [filters.search, filters.country, filters.sort, page, setSearchParams])

  const filterCount = useMemo(() => countActiveFilters(filters, profileCriteriaCount), [filters, profileCriteriaCount])
  const showClear = filterCount > 0 || !filters.useProfileFilters
  const canShowInterest = limitInfo.allowed
  const interestLabel = limitInfo.limit != null ? `${limitInfo.current}/${limitInfo.limit}` : `${limitInfo.current}`

  const syncQuickFilters = (patch: Partial<UniversityFilters>) => {
    setPage(1)
    setFilters((current) => ({ ...current, ...patch }))
    setDraftFilters((current) => ({ ...current, ...patch }))
  }

  const openFullFilter = () => {
    setDraftFilters(filters)
    setFilterModalOpen(true)
  }

  const handleApplyFullFilters = () => {
    setPage(1)
    setFilters({ ...draftFilters })
    setFilterModalOpen(false)
  }

  const handleClearFilters = () => {
    const cleared = createInitialFilters(false)
    setPage(1)
    setFilters(cleared)
    setDraftFilters(cleared)
    setFilterModalOpen(false)
  }

  const handleInterest = (id: string) => {
    if (interestedIds.has(id) || !limitInfo.allowed) return
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
            <p className="max-w-3xl text-sm text-[var(--color-text-muted)]">
              {t('student:quickUniversityFiltersHint', 'Search universities by name, program, faculty, requirements, and country. Open the full filter for a deeper search across all university data.')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{filterCount} {t('student:activeFilters', 'active')}</Badge>
            <Badge variant={filters.useProfileFilters ? 'success' : 'default'}>
              {filters.useProfileFilters
                ? t('student:profileMatchingOn', 'Profile matching on')
                : t('student:profileMatchingOff', 'Profile matching off')}
            </Badge>
            <Button variant="secondary" size="sm" onClick={openFullFilter} icon={<SlidersHorizontal size={16} />}>
              {t('student:fullFilter', 'Full Filter')}
            </Button>
            {showClear ? (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                {t('student:clearFilters', 'Clear filters')}
              </Button>
            ) : null}
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

      {filters.useProfileFilters && profileCriteriaCount > 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          {t('student:profileFiltersApplied', 'Using your profile')}: {profileCriteria.faculties} {t('student:faculties', 'faculties')}, {profileCriteria.countries} {t('student:countries', 'countries')}
        </p>
      ) : null}

      {limitInfo.limit != null ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          {t('student:interestUsage', { current: interestLabel, defaultValue: 'Interests used: {{current}}' })}{' '}
          {!canShowInterest && limitInfo.limit != null && interestedIds.size >= limitInfo.limit
            ? t('student:interestLimitReachedInline', '(limit reached, upgrade to add more)')
            : null}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Search size={16} className="text-[var(--color-text-muted)]" />
        <p className="text-[var(--color-text-muted)]">
          {list.length === 0 && !loading
            ? t('student:noUniversitiesFound', 'No universities found')
            : t('student:universitiesFound', { count: total, defaultValue: '{{count}} universities found' })}
        </p>
      </div>

      <Modal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        panelClassName="max-w-6xl"
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

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : list.length === 0 ? (
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {list.map((university, index) => (
              <div
                key={university.id}
                className="animate-card-enter opacity-0"
                style={{ animationDelay: `${Math.min(index, 9) * 0.05}s`, animationFillMode: 'forwards' }}
              >
                <UniversityCard
                  university={university}
                  showMatch
                  onInterest={handleInterest}
                  interested={interestedIds.has(university.id)}
                  interestDisabled={!canShowInterest}
                />
              </div>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="mt-6 flex justify-center gap-2">
              <Button variant="secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
                {t('common:prev', 'Previous')}
              </Button>
              <span className="px-4 py-2 text-sm text-[var(--color-text-muted)]">
                {t('common:pageOfTotal', { page, totalPages, total, defaultValue: 'Page {{page}} of {{totalPages}} · {{total}} total' })}
              </span>
              <Button variant="secondary" onClick={() => setPage((current) => current + 1)} disabled={page >= totalPages}>
                {t('common:next', 'Next')}
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
    <section className="rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.92))] p-4 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.5)]">
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
