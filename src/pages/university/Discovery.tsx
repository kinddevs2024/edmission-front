import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { Checkbox } from '@/components/ui/Checkbox'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PageTitle } from '@/components/ui/PageTitle'
import { Select } from '@/components/ui/Select'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { getProfileCriteria } from '@/services/options'
import { getStudentAvatarUrl } from '@/services/upload'
import { getStudents, type DiscoverStudentItem, type StudentSearchParams } from '@/services/university'
import { getStudentContactEmail, getStudentDisplayName } from '@/utils/studentDisplay'
import { toastApiError } from '@/utils/toastError'
import { Lock, MessageCircle, Search, SlidersHorizontal, User } from 'lucide-react'

const COUNTRY_OPTIONS = [
  { value: '', label: 'All countries' },
  { value: 'USA', label: 'USA' },
  { value: 'UK', label: 'UK' },
  { value: 'Germany', label: 'Germany' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'Uzbekistan', label: 'Uzbekistan' },
  { value: 'Russia', label: 'Russia' },
  { value: 'Kazakhstan', label: 'Kazakhstan' },
  { value: 'Turkey', label: 'Turkey' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Australia', label: 'Australia' },
]

const TARGET_DEGREE_OPTIONS = [
  { value: '', label: 'Any degree' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'phd', label: 'PhD' },
]

const EDUCATION_STATUS_OPTIONS = [
  { value: '', label: 'Any education status' },
  { value: 'in_school', label: 'In school' },
  { value: 'finished_school', label: 'School Student' },
  { value: 'in_university', label: 'In university' },
  { value: 'finished_university', label: 'Finished university' },
]

const SCHOOL_COMPLETED_OPTIONS = [
  { value: '', label: 'Any completion status' },
  { value: 'true', label: 'Completed' },
  { value: 'false', label: 'Not completed' },
]

const LANGUAGE_OPTIONS = ['English', 'Russian', 'Uzbek', 'German', 'French', 'Spanish', 'Italian', 'Chinese', 'Arabic']
const LANGUAGE_LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'IELTS 5.5', 'IELTS 6.0', 'IELTS 6.5', 'TOEFL 80', 'TOEFL 90']
const CERT_TYPE_OPTIONS = [
  { value: '', label: 'Any certificate' },
  { value: 'IELTS', label: 'IELTS' },
  { value: 'TOEFL', label: 'TOEFL' },
  { value: 'CEFR', label: 'CEFR' },
  { value: 'Cambridge', label: 'Cambridge' },
  { value: 'Duolingo', label: 'Duolingo' },
  { value: 'PTE', label: 'PTE' },
  { value: 'SAT', label: 'SAT' },
  { value: 'other', label: 'Other' },
]

const BUDGET_CURRENCY_OPTIONS = [
  { value: '', label: 'Any currency' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'UZS', label: 'UZS' },
  { value: 'RUB', label: 'RUB' },
  { value: 'KZT', label: 'KZT' },
]

const DOCUMENT_TYPE_FILTERS = [
  { value: 'transcript', label: 'Transcript' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'language_certificate', label: 'Language certificate' },
  { value: 'course_certificate', label: 'Course certificate' },
  { value: 'passport', label: 'Passport' },
  { value: 'id_card', label: 'ID card' },
  { value: 'other', label: 'Other' },
]

type DiscoveryFilters = {
  search: string
  country: string
  city: string
  schoolName: string
  educationStatus: string
  targetDegreeLevel: string
  schoolCompleted: '' | 'true' | 'false'
  languages: string[]
  languageLevels: string[]
  certType: string
  certMinScore: string
  documentTypes: string[]
  documentQuery: string
  skills: string[]
  interests: string[]
  hobbies: string[]
  preferredCountries: string
  interestedFaculties: string
  minBudget: string
  maxBudget: string
  budgetCurrency: string
  gpaMin: string
  gpaMax: string
  graduationYearMin: string
  graduationYearMax: string
  verifiedOnly: boolean
  hasPortfolio: boolean
  useProfileFilters: boolean
}

function createInitialFilters(useProfileFilters = true): DiscoveryFilters {
  return {
    search: '',
    country: '',
    city: '',
    schoolName: '',
    educationStatus: '',
    targetDegreeLevel: '',
    schoolCompleted: '',
    languages: [],
    languageLevels: [],
    certType: '',
    certMinScore: '',
    documentTypes: [],
    documentQuery: '',
    skills: [],
    interests: [],
    hobbies: [],
    preferredCountries: '',
    interestedFaculties: '',
    minBudget: '',
    maxBudget: '',
    budgetCurrency: '',
    gpaMin: '',
    gpaMax: '',
    graduationYearMin: '',
    graduationYearMax: '',
    verifiedOnly: false,
    hasPortfolio: false,
    useProfileFilters,
  }
}

export function Discovery() {
  const { t } = useTranslation(['common', 'university'])
  const [list, setList] = useState<DiscoverStudentItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [criteria, setCriteria] = useState<{ skills: string[]; interests: string[]; hobbies: string[] } | null>(null)
  const [filters, setFilters] = useState<DiscoveryFilters>(() => createInitialFilters(true))
  const [draftFilters, setDraftFilters] = useState<DiscoveryFilters>(() => createInitialFilters(true))
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const limit = 20

  useEffect(() => {
    getProfileCriteria().then(setCriteria).catch(() => setCriteria({ skills: [], interests: [], hobbies: [] }))
  }, [])

  useEffect(() => {
    setLoading(true)
    getStudents(buildStudentSearchParams(page, limit, filters))
      .then((res) => {
        setList(res.data ?? [])
        setTotal(res.total ?? 0)
      })
      .catch((error) => {
        toastApiError(error)
        setList([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [page, filters])

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const filterCount = useMemo(() => countActiveFilters(filters), [filters])
  const hasExplicitFilters = filterCount > 0
  const showClear = hasExplicitFilters || !filters.useProfileFilters

  const syncQuickFilters = (patch: Partial<DiscoveryFilters>) => {
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

  return (
    <div className="space-y-5">
      <div data-onboarding="university-discovery-overview">
        <PageTitle title={t('university:navDiscovery')} icon="Users" />
      </div>

      <Card className="space-y-4 overflow-hidden border border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(15,23,42,0.03)_0%,rgba(14,165,233,0.07)_100%)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Student catalog</p>
            <h2 className="text-xl font-semibold text-[var(--color-text)]">Quick filters for fast triage</h2>
            <p className="max-w-3xl text-sm text-[var(--color-text-muted)]">
              Keep the basic filters here, and open the full filter to search by profile, education, documents, languages, and budget in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{filterCount} active</Badge>
            <Badge variant={filters.useProfileFilters ? 'success' : 'default'}>
              {filters.useProfileFilters ? 'University profile matching on' : 'University profile matching off'}
            </Badge>
            <Button variant="secondary" size="sm" onClick={openFullFilter} icon={<SlidersHorizontal size={16} />}>
              Full Filter
            </Button>
            {showClear ? (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                {t('common:clear', 'Clear')}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Input
            label="Search"
            placeholder="Name, email, city, school"
            value={filters.search}
            onChange={(event) => syncQuickFilters({ search: event.target.value })}
          />
          <Select
            label={t('common:country', 'Country')}
            options={COUNTRY_OPTIONS}
            value={filters.country}
            onChange={(event) => syncQuickFilters({ country: event.target.value })}
          />
          <Input
            label={t('university:filterMinBudget', 'Min budget')}
            type="number"
            min={0}
            step={100}
            placeholder="5000"
            value={filters.minBudget}
            onChange={(event) => syncQuickFilters({ minBudget: event.target.value })}
          />
          <Input
            label={t('university:filterMaxBudget', 'Max budget')}
            type="number"
            min={0}
            step={100}
            placeholder="50000"
            value={filters.maxBudget}
            onChange={(event) => syncQuickFilters({ maxBudget: event.target.value })}
          />
          <Select
            label="Target degree"
            options={TARGET_DEGREE_OPTIONS}
            value={filters.targetDegreeLevel}
            onChange={(event) => syncQuickFilters({ targetDegreeLevel: event.target.value })}
          />
        </div>

        {showClear ? (
          <div className="flex flex-wrap gap-2">
            {buildActiveFilterLabels(filters).map((label) => (
              <span key={label} className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/85 px-3 py-1 text-xs text-[var(--color-text-muted)]">
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Search size={16} className="text-[var(--color-text-muted)]" />
        <p className="text-[var(--color-text-muted)]">
          {list.length === 0 && !loading
            ? t('university:discoveryEmptyHint')
            : t('university:discoveryHint', { count: total })}
        </p>
      </div>

      <Modal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        title={(
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Full Filter</h2>
            <p className="text-sm font-normal text-[var(--color-text-muted)]">
              Search across student profile, education, language data, documents, school history, budget, and portfolio signals.
            </p>
          </div>
        )}
        panelClassName="max-w-6xl"
        footerClassName="justify-between"
        footer={(
          <>
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <span>{countActiveFilters(draftFilters)} active filters</span>
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
              title="Basics"
              description="Search by identity, geography, degree target, and school or institution."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="Search"
                  placeholder="Name, email, school, city"
                  value={draftFilters.search}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))}
                />
                <Select
                  label={t('common:country', 'Country')}
                  options={COUNTRY_OPTIONS}
                  value={draftFilters.country}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, country: event.target.value }))}
                />
                <Input
                  label={t('common:city', 'City')}
                  placeholder="City"
                  value={draftFilters.city}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, city: event.target.value }))}
                />
                <Input
                  label="School / institution"
                  placeholder="School, university, lyceum"
                  value={draftFilters.schoolName}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, schoolName: event.target.value }))}
                />
                <Select
                  label="Education status"
                  options={EDUCATION_STATUS_OPTIONS}
                  value={draftFilters.educationStatus}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, educationStatus: event.target.value }))}
                />
                <Select
                  label="Target degree"
                  options={TARGET_DEGREE_OPTIONS}
                  value={draftFilters.targetDegreeLevel}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, targetDegreeLevel: event.target.value }))}
                />
                <Select
                  label="Completion status"
                  options={SCHOOL_COMPLETED_OPTIONS}
                  value={draftFilters.schoolCompleted}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, schoolCompleted: event.target.value as DiscoveryFilters['schoolCompleted'] }))}
                />
              </div>
            </FilterSection>

            <FilterSection
              title="Academics And Budget"
              description="Narrow by GPA, graduation year, available budget, and budget currency."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="GPA from" type="number" min={0} step="0.1" value={draftFilters.gpaMin} onChange={(event) => setDraftFilters((current) => ({ ...current, gpaMin: event.target.value }))} />
                <Input label="GPA to" type="number" min={0} step="0.1" value={draftFilters.gpaMax} onChange={(event) => setDraftFilters((current) => ({ ...current, gpaMax: event.target.value }))} />
                <Input label="Graduation year from" type="number" min={1950} max={2100} value={draftFilters.graduationYearMin} onChange={(event) => setDraftFilters((current) => ({ ...current, graduationYearMin: event.target.value }))} />
                <Input label="Graduation year to" type="number" min={1950} max={2100} value={draftFilters.graduationYearMax} onChange={(event) => setDraftFilters((current) => ({ ...current, graduationYearMax: event.target.value }))} />
                <Input label={t('university:filterMinBudget', 'Min budget')} type="number" min={0} step={100} value={draftFilters.minBudget} onChange={(event) => setDraftFilters((current) => ({ ...current, minBudget: event.target.value }))} />
                <Input label={t('university:filterMaxBudget', 'Max budget')} type="number" min={0} step={100} value={draftFilters.maxBudget} onChange={(event) => setDraftFilters((current) => ({ ...current, maxBudget: event.target.value }))} />
                <Select label="Budget currency" options={BUDGET_CURRENCY_OPTIONS} value={draftFilters.budgetCurrency} onChange={(event) => setDraftFilters((current) => ({ ...current, budgetCurrency: event.target.value }))} />
              </div>
            </FilterSection>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <FilterSection
              title="Languages And Documents"
              description="Filter by spoken languages, CEFR-like levels, IELTS/TOEFL/CEFR documents, and approved document types."
            >
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('university:languages', 'Languages')}</label>
                  <ChipSelect
                    options={LANGUAGE_OPTIONS}
                    value={draftFilters.languages}
                    onChange={(value) => setDraftFilters((current) => ({ ...current, languages: value }))}
                    max={12}
                    placeholder="Match language names in the student profile"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Language levels</label>
                  <ChipSelect
                    options={LANGUAGE_LEVEL_OPTIONS}
                    value={draftFilters.languageLevels}
                    onChange={(value) => setDraftFilters((current) => ({ ...current, languageLevels: value }))}
                    max={12}
                    placeholder="A1-C2, IELTS, TOEFL and similar labels"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Select
                    label={t('university:certType', 'Certificate')}
                    options={CERT_TYPE_OPTIONS}
                    value={draftFilters.certType}
                    onChange={(event) => setDraftFilters((current) => ({ ...current, certType: event.target.value }))}
                  />
                  <Input
                    label={t('university:certMinScore', 'Min score')}
                    type="number"
                    min={0}
                    step="0.1"
                    placeholder="e.g. 6.5"
                    value={draftFilters.certMinScore}
                    onChange={(event) => setDraftFilters((current) => ({ ...current, certMinScore: event.target.value }))}
                  />
                  <Input
                    label="Document query"
                    placeholder="IELTS, CEFR, transcript, passport"
                    value={draftFilters.documentQuery}
                    onChange={(event) => setDraftFilters((current) => ({ ...current, documentQuery: event.target.value }))}
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">Document types</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {DOCUMENT_TYPE_FILTERS.map((item) => {
                      const checked = draftFilters.documentTypes.includes(item.value)
                      return (
                        <Checkbox
                          key={item.value}
                          checked={checked}
                          onChange={() =>
                            setDraftFilters((current) => ({
                              ...current,
                              documentTypes: checked
                                ? current.documentTypes.filter((value) => value !== item.value)
                                : [...current.documentTypes, item.value],
                            }))
                          }
                          label={item.label}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            </FilterSection>

            <FilterSection
              title="Interests And Profile Signals"
              description="Use hobbies, skills, preferred countries, faculties, verified status, and portfolio signal to find one exact candidate."
            >
              <div className="space-y-4">
                {criteria ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium">{t('university:skills', 'Skills')}</label>
                      <ChipSelect options={criteria.skills} value={draftFilters.skills} onChange={(value) => setDraftFilters((current) => ({ ...current, skills: value }))} max={20} placeholder="Student skills" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">{t('university:interests', 'Interests')}</label>
                      <ChipSelect options={criteria.interests} value={draftFilters.interests} onChange={(value) => setDraftFilters((current) => ({ ...current, interests: value }))} max={20} placeholder="Student interests" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">{t('university:hobbies', 'Hobbies')}</label>
                      <ChipSelect options={criteria.hobbies} value={draftFilters.hobbies} onChange={(value) => setDraftFilters((current) => ({ ...current, hobbies: value }))} max={20} placeholder="Student hobbies" />
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    label="Preferred countries"
                    placeholder="Comma separated, e.g. USA, Canada, Germany"
                    value={draftFilters.preferredCountries}
                    onChange={(event) => setDraftFilters((current) => ({ ...current, preferredCountries: event.target.value }))}
                  />
                  <Input
                    label="Interested faculties"
                    placeholder="Comma separated faculty codes or names"
                    value={draftFilters.interestedFaculties}
                    onChange={(event) => setDraftFilters((current) => ({ ...current, interestedFaculties: event.target.value }))}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Checkbox checked={draftFilters.verifiedOnly} onChange={(event) => setDraftFilters((current) => ({ ...current, verifiedOnly: event.target.checked }))} label="Only verified student profiles" />
                  <Checkbox checked={draftFilters.hasPortfolio} onChange={(event) => setDraftFilters((current) => ({ ...current, hasPortfolio: event.target.checked }))} label="Only students with portfolio works" />
                  <Checkbox checked={draftFilters.useProfileFilters} onChange={(event) => setDraftFilters((current) => ({ ...current, useProfileFilters: event.target.checked }))} label="Also apply university profile defaults" />
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
            icon={<User className="h-14 w-14 text-[var(--color-text-muted)] opacity-60" />}
            title={t('university:noStudents')}
            description={t('university:discoveryEmptyDesc')}
            actionLabel={t('university:viewPipeline')}
            actionTo="/university/pipeline"
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {list.map((item, index) => {
              const student = item.student
              const name = getStudentDisplayName(
                student,
                student?.profileVisibility === 'private'
                  ? t('university:privateStudentCardName', 'Private student')
                  : t('university:studentLabel')
              )
              const email = getStudentContactEmail(student)
              const languages = student.languages?.slice(0, 2).map((entry) => `${entry.language}${entry.level ? ` (${entry.level})` : ''}`).join(', ')
              const degreeLabel = formatDegree(student.targetDegreeLevel)

              return (
                <div
                  key={item.id}
                  className="animate-card-enter opacity-0"
                  style={{ animationDelay: `${Math.min(index, 8) * 0.05}s`, animationFillMode: 'forwards' }}
                >
                  <Card interactive tilt className="flex h-full flex-col">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="h-11 w-11 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-border)] flex items-center justify-center shrink-0">
                          {student?.profileVisibility === 'private' ? (
                            <Lock className="h-5 w-5 text-[var(--color-text-muted)]" aria-hidden />
                          ) : (
                            <img src={getStudentAvatarUrl(student?.avatarUrl)} alt="" loading="lazy" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="truncate">{name}</CardTitle>
                          {email && email !== name ? <p className="truncate text-xs text-[var(--color-text-muted)]">{email}</p> : null}
                          {(student?.country || student?.city) ? <p className="truncate text-xs text-[var(--color-text-muted)]">{[student.country, student.city].filter(Boolean).join(', ')}</p> : null}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {item.inPipeline ? <Badge variant="success">{t('university:inPipeline', 'In pipeline')}</Badge> : null}
                        {student?.verifiedAt ? <Badge variant="default">Verified</Badge> : null}
                      </div>
                    </div>

                    <div className="grid gap-2 text-sm text-[var(--color-text-muted)]">
                      {student?.schoolName ? <MetaLine label="School" value={student.schoolName} /> : null}
                      {student?.gpa != null ? <MetaLine label="GPA" value={String(student.gpa)} /> : null}
                      {student?.graduationYear ? <MetaLine label="Graduation" value={String(student.graduationYear)} /> : null}
                      {degreeLabel ? <MetaLine label="Degree target" value={degreeLabel} /> : null}
                      {student?.budgetAmount != null && Number(student.budgetAmount) >= 0 ? (
                        <MetaLine label={t('university:budgetLabel', 'Budget')} value={`${Number(student.budgetAmount).toLocaleString()} ${student.budgetCurrency || 'USD'}`} />
                      ) : null}
                      {languages ? <MetaLine label="Languages" value={languages} /> : null}
                      {student?.portfolioCompletionPercent != null && Number(student.portfolioCompletionPercent) > 0 ? <MetaLine label="Portfolio" value={`${student.portfolioCompletionPercent}%`} /> : null}
                    </div>

                    <div className="mt-auto flex flex-wrap gap-2 pt-4">
                      <Button to={`/university/students/${encodeURIComponent(item.id)}`} variant="secondary" size="sm" icon={<User size={16} />}>
                        {t('university:viewFullProfile', 'Full profile')}
                      </Button>
                      <Button to={`/university/chat?studentId=${encodeURIComponent(item.id)}`} variant="ghost" size="sm" icon={<MessageCircle size={16} />}>
                        {t('university:navChat')}
                      </Button>
                    </div>
                  </Card>
                </div>
              )
            })}
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                Previous
              </Button>
              <span className="text-sm text-[var(--color-text-muted)]">
                {page} / {totalPages}
              </span>
              <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
                Next
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

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="truncate">
      <span className="font-medium text-[var(--color-text)]">{label}:</span> {value}
    </p>
  )
}

function buildStudentSearchParams(page: number, limit: number, filters: DiscoveryFilters): StudentSearchParams {
  return {
    page,
    limit,
    search: filters.search.trim() || undefined,
    country: filters.country || undefined,
    city: filters.city.trim() || undefined,
    schoolName: filters.schoolName.trim() || undefined,
    educationStatus: filters.educationStatus || undefined,
    targetDegreeLevel: filters.targetDegreeLevel || undefined,
    schoolCompleted: filters.schoolCompleted === '' ? undefined : filters.schoolCompleted === 'true',
    languages: filters.languages.length ? filters.languages : undefined,
    languageLevels: filters.languageLevels.length ? filters.languageLevels : undefined,
    certType: filters.certType || undefined,
    certMinScore: filters.certMinScore.trim() || undefined,
    documentTypes: filters.documentTypes.length ? filters.documentTypes : undefined,
    documentQuery: filters.documentQuery.trim() || undefined,
    skills: filters.skills.length ? filters.skills : undefined,
    interests: filters.interests.length ? filters.interests : undefined,
    hobbies: filters.hobbies.length ? filters.hobbies : undefined,
    preferredCountries: tokenizeFilterInput(filters.preferredCountries),
    interestedFaculties: tokenizeFilterInput(filters.interestedFaculties),
    minBudget: filters.minBudget.trim() ? Number(filters.minBudget) : undefined,
    maxBudget: filters.maxBudget.trim() ? Number(filters.maxBudget) : undefined,
    budgetCurrency: filters.budgetCurrency || undefined,
    gpaMin: filters.gpaMin.trim() ? Number(filters.gpaMin) : undefined,
    gpaMax: filters.gpaMax.trim() ? Number(filters.gpaMax) : undefined,
    graduationYearMin: filters.graduationYearMin.trim() ? Number(filters.graduationYearMin) : undefined,
    graduationYearMax: filters.graduationYearMax.trim() ? Number(filters.graduationYearMax) : undefined,
    verifiedOnly: filters.verifiedOnly || undefined,
    hasPortfolio: filters.hasPortfolio || undefined,
    useProfileFilters: filters.useProfileFilters,
  }
}

function tokenizeFilterInput(value: string) {
  const tokens = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return tokens.length ? tokens : undefined
}

function countActiveFilters(filters: DiscoveryFilters) {
  return [
    filters.search.trim(),
    filters.country,
    filters.city.trim(),
    filters.schoolName.trim(),
    filters.educationStatus,
    filters.targetDegreeLevel,
    filters.schoolCompleted,
    filters.languages.length,
    filters.languageLevels.length,
    filters.certType,
    filters.certMinScore.trim(),
    filters.documentTypes.length,
    filters.documentQuery.trim(),
    filters.skills.length,
    filters.interests.length,
    filters.hobbies.length,
    filters.preferredCountries.trim(),
    filters.interestedFaculties.trim(),
    filters.minBudget.trim(),
    filters.maxBudget.trim(),
    filters.budgetCurrency,
    filters.gpaMin.trim(),
    filters.gpaMax.trim(),
    filters.graduationYearMin.trim(),
    filters.graduationYearMax.trim(),
    filters.verifiedOnly,
    filters.hasPortfolio,
  ].filter((value) => (typeof value === 'number' ? value > 0 : Boolean(value))).length
}

function buildActiveFilterLabels(filters: DiscoveryFilters) {
  const labels: string[] = []
  if (filters.search.trim()) labels.push(`Search: ${filters.search.trim()}`)
  if (filters.country) labels.push(`Country: ${filters.country}`)
  if (filters.targetDegreeLevel) labels.push(`Degree: ${formatDegree(filters.targetDegreeLevel)}`)
  if (filters.minBudget.trim() || filters.maxBudget.trim()) {
    labels.push(`Budget: ${filters.minBudget.trim() || '0'}-${filters.maxBudget.trim() || 'max'} ${filters.budgetCurrency || ''}`.trim())
  }
  if (filters.schoolName.trim()) labels.push(`School: ${filters.schoolName.trim()}`)
  if (filters.certType) labels.push(`Certificate: ${filters.certType}`)
  if (filters.documentQuery.trim()) labels.push(`Document: ${filters.documentQuery.trim()}`)
  if (filters.verifiedOnly) labels.push('Verified only')
  if (filters.hasPortfolio) labels.push('Has portfolio')
  if (!filters.useProfileFilters) labels.push('University matching off')
  return labels.slice(0, 10)
}

function formatDegree(value?: string) {
  if (value === 'bachelor') return 'Bachelor'
  if (value === 'master') return 'Master'
  if (value === 'phd') return 'PhD'
  return ''
}
