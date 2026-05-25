import { useMemo } from 'react'
import { useSessionStorage } from '@/hooks/useSessionStorage'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageTitle } from '@/components/ui/PageTitle'
import { Card, CardTitle } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { UniversityCard } from '@/components/student/UniversityCard'
import { Building2 } from 'lucide-react'
import { listMyStudents, addInterestForStudent, listStudentUniversities, type CounsellorStudent, type CounsellorStudentUniversitiesParams } from '@/services/counsellor'
import { getUniversityHubCountries } from '@/services/options'
import { toastApiError } from '@/utils/toastError'
import { getLocalizedCountryName } from '@/utils/localeDisplay'

export function CounsellorStudentInterests() {
  const { t, i18n } = useTranslation(['school', 'student', 'common'])
  const queryClient = useQueryClient()

  const [draftStudentId, setDraftStudentId] = useSessionStorage<string>('counsellor_draftStudentId', '')
  const [selectedStudentId, setSelectedStudentId] = useSessionStorage<string>('counsellor_selectedStudentId', '')
  const [country, setCountry] = useSessionStorage<string>('counsellor_country', '')
  const [city, setCity] = useSessionStorage<string>('counsellor_city', '')
  const [scholarshipFilter, setScholarshipFilter] = useSessionStorage<'all' | 'with' | 'without'>('counsellor_scholarshipFilter', 'all')
  const [page, setPage] = useSessionStorage('counsellor_page', 1)
  const [useProfileFilters, setUseProfileFilters] = useSessionStorage('counsellor_useProfileFilters', false)

  const { data: studentsRes, isLoading: studentsLoading } = useQuery({
    queryKey: ['counsellor', 'students', 'for-interests'],
    queryFn: () => listMyStudents({ page: 1, limit: 100 }),
    staleTime: 60 * 1000,
  })
  const students = studentsRes?.data ?? []
  const { data: universityCountries = [] } = useQuery({
    queryKey: ['options', 'universityCountries'],
    queryFn: getUniversityHubCountries,
    staleTime: 5 * 60 * 1000,
  })

  const vars: CounsellorStudentUniversitiesParams = {
    page,
    limit: 12,
    country: country || undefined,
    city: city.trim() || undefined,
    hasScholarship: scholarshipFilter === 'with' ? true : undefined,
    useProfileFilters,
  }

  const { data: universitiesRes, isLoading: universitiesLoading } = useQuery({
    queryKey: ['counsellor', 'student-universities', selectedStudentId, vars.page, vars.country, vars.city, scholarshipFilter, vars.useProfileFilters],
    queryFn: () => listStudentUniversities(selectedStudentId, vars),
    enabled: !!selectedStudentId,
    staleTime: 30 * 1000,
  })

  const rawUniversities = universitiesRes?.data ?? []
  const universities = useMemo(
    () => scholarshipFilter === 'without' ? rawUniversities.filter((university) => !university.hasScholarship) : rawUniversities,
    [rawUniversities, scholarshipFilter]
  )
  const total = scholarshipFilter === 'without' ? universities.length : universitiesRes?.total ?? 0
  const limitPerPage = 12
  const totalPages = Math.max(1, Math.ceil(total / limitPerPage))

  const interestMutation = useMutation({
    mutationFn: ({ studentId, universityId }: { studentId: string; universityId: string }) =>
      addInterestForStudent(studentId, universityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counsellor', 'student-universities'] })
    },
    onError: toastApiError,
  })

  const handleSendInterest = (universityId: string) => {
    if (!selectedStudentId) return
    interestMutation.mutate({ studentId: selectedStudentId, universityId })
  }

  const handleFilterChange = () => {
    setPage(1)
    setUseProfileFilters(false)
  }

  const handleShowUniversities = () => {
    setSelectedStudentId(draftStudentId)
    setCountry('')
    setCity('')
    setScholarshipFilter('all')
    setPage(1)
    setUseProfileFilters(false)
  }

  const isRu = i18n.resolvedLanguage?.startsWith('ru')
  const isUz = i18n.resolvedLanguage?.startsWith('uz')
  const localized = {
    filtersTitle: isRu ? 'Фильтры' : isUz ? 'Filtrlar' : 'Filters',
    selectStudentPlaceholder: isRu ? 'Выберите студента' : isUz ? 'Talabani tanlang' : 'Select a student',
    studentLabel: isRu ? 'Студент' : isUz ? 'Talaba' : 'Student',
    interestedButton: isRu ? 'Интересуется' : isUz ? 'Qiziqish bildirish' : 'Mark interested',
  }

  const countryOptions = [
    { value: '', label: t('student:allCountries') },
    { value: 'USA', label: isRu ? 'США' : isUz ? 'AQSH' : 'USA' },
    { value: 'UK', label: isRu ? 'Великобритания' : isUz ? 'Buyuk Britaniya' : 'UK' },
    { value: 'Germany', label: isRu ? 'Германия' : isUz ? 'Germaniya' : 'Germany' },
    { value: 'Netherlands', label: isRu ? 'Нидерланды' : isUz ? 'Niderlandiya' : 'Netherlands' },
  ]

  void countryOptions

  const scholarshipOptions = [
    { value: 'all', label: t('school:allUniversities', 'All universities') },
    { value: 'with', label: t('school:withScholarship', 'With scholarship') },
    { value: 'without', label: t('school:withoutScholarship', 'Without scholarship') },
  ]
  const availableCountryOptions = useMemo(() => {
    const countries = new Set(
      universityCountries
        .map((value) => String(value ?? '').trim())
        .filter(Boolean)
    )
    if (country) countries.add(country)
    return [
      { value: '', label: t('student:allCountries') },
      ...Array.from(countries)
        .sort((left, right) => getLocalizedCountryName(left, i18n.language).localeCompare(getLocalizedCountryName(right, i18n.language)))
        .map((value) => ({ value, label: getLocalizedCountryName(value, i18n.language) })),
    ]
  }, [country, i18n.language, t, universityCountries])

  const handleClearFilters = () => {
    setCountry('')
    setCity('')
    setScholarshipFilter('all')
    setPage(1)
    setUseProfileFilters(false)
  }

  const headerTitle = t('school:studentInterestsTitle', 'Student interests')

  return (
    <div className="space-y-4">
      <PageTitle title={headerTitle} icon="HeartHandshake" />

      <Card>
        <CardTitle className="mb-3">{t('school:studentInterestsSelectStudent', 'Choose student')}</CardTitle>
        {studentsLoading ? (
          <p className="text-sm text-[var(--color-text-muted)]">{t('school:loadingStudents', 'Loading students...')}</p>
        ) : students.length === 0 ? (
          <EmptyState
            icon={<Building2 className="w-10 h-10 text-[var(--color-text-muted)]" />}
            title={t('school:noStudentsYet', 'No students yet')}
            description={t('school:studentInterestsNoStudentsHint', 'Create or invite students first to send interests.')}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_auto] items-end">
            <div>
              <Select
                label={localized.studentLabel}
                value={draftStudentId}
                onChange={(e) => {
                  setDraftStudentId(e.target.value)
                }}
                options={[
                  { value: '', label: localized.selectStudentPlaceholder },
                  ...students.map((s: CounsellorStudent) => ({
                    value: s.userId,
                    label: s.name || [s.firstName, s.lastName].filter(Boolean).join(' ') || s.email,
                  })),
                ]}
              />
            </div>
            <Button className="min-h-[44px]" onClick={handleShowUniversities} disabled={!draftStudentId}>
              {t('school:showUniversities', 'Show universities')}
            </Button>
          </div>
        )}
      </Card>

      {selectedStudentId && (
        <Card>
          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>
                {t('school:studentInterestsUniversities', 'Universities for this student')}
              </CardTitle>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {t('school:studentInterestsFilterHint', 'Filter universities before marking interest for the selected student.')}
              </p>
            </div>
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-4 lg:w-auto lg:min-w-[760px]">
              <Select
                label={t('student:country')}
                value={country}
                onChange={(e) => { setCountry(e.target.value); handleFilterChange() }}
                options={availableCountryOptions}
              />
              <Input
                label={t('student:city')}
                value={city}
                onChange={(e) => { setCity(e.target.value); handleFilterChange() }}
              />
              <Select
                label={t('documents:type.scholarship', 'Scholarship')}
                value={scholarshipFilter}
                onChange={(e) => {
                  setScholarshipFilter(e.target.value as 'all' | 'with' | 'without')
                  handleFilterChange()
                }}
                options={scholarshipOptions}
              />
              <div className="flex items-end">
                <Button variant="secondary" className="w-full" onClick={handleClearFilters}>
                  {t('student:clearFilters', 'Clear filters')}
                </Button>
              </div>
            </div>
          </div>
          {universitiesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
            </div>
          ) : universities.length === 0 ? (
            <EmptyState
              icon={<Building2 className="w-12 h-12 text-[var(--color-text-muted)] opacity-70" />}
              title={t('student:noUniversitiesFound')}
              description={t('student:tryChangingFiltersOrSearch')}
              actionLabel={t('student:clearFilters')}
              onAction={handleClearFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {universities.map((u, index) => (
                  <div
                    key={u.id}
                    className="animate-card-enter opacity-0"
                    style={{ animationDelay: `${Math.min(index, 9) * 0.05}s`, animationFillMode: 'forwards' }}
                  >
                    <UniversityCard
                      university={u}
                      showMatch
                      onInterest={() => handleSendInterest(u.id)}
                      interested={false}
                      interestDisabled={interestMutation.isPending}
                      detailsTo={`/school/student-interests/${selectedStudentId}/universities/${u.id}`}
                    />
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    {t('common:prev', 'Previous')}
                  </Button>
                  <span className="py-2 px-4 text-sm text-[var(--color-text-muted)]">
                    {t('common:pageOfTotal', { page, totalPages, total })}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages}
                  >
                    {t('common:next', 'Next')}
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  )
}
