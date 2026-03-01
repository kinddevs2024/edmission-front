import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { PageTitle } from '@/components/ui/PageTitle'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { MessageCircle, User, SlidersHorizontal } from 'lucide-react'
import { getStudents, type DiscoverStudentItem } from '@/services/university'
import { getProfileCriteria } from '@/services/options'

const COUNTRY_OPTIONS = [
  { value: '', label: 'All countries' },
  { value: 'USA', label: 'USA' },
  { value: 'UK', label: 'UK' },
  { value: 'Germany', label: 'Germany' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'Uzbekistan', label: 'Uzbekistan' },
  { value: 'Russia', label: 'Russia' },
  { value: 'Kazakhstan', label: 'Kazakhstan' },
]

const LANGUAGE_OPTIONS = ['English', 'Russian', 'Uzbek', 'German', 'French', 'Spanish', 'Italian', 'Other']

const CERT_TYPE_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'IELTS', label: 'IELTS' },
  { value: 'TOEFL', label: 'TOEFL' },
  { value: 'Cambridge', label: 'Cambridge' },
  { value: 'Duolingo', label: 'Duolingo' },
  { value: 'other', label: 'Other' },
]

export function Discovery() {
  const { t } = useTranslation(['common', 'university'])
  const [list, setList] = useState<DiscoverStudentItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [criteria, setCriteria] = useState<{ skills: string[]; interests: string[]; hobbies: string[] } | null>(null)
  const [filterCountry, setFilterCountry] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterLanguages, setFilterLanguages] = useState<string[]>([])
  const [filterCertType, setFilterCertType] = useState('')
  const [filterCertMinScore, setFilterCertMinScore] = useState('')
  const [filterSkills, setFilterSkills] = useState<string[]>([])
  const [filterInterests, setFilterInterests] = useState<string[]>([])
  const [filterHobbies, setFilterHobbies] = useState<string[]>([])
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const limit = 20

  useEffect(() => {
    getProfileCriteria().then(setCriteria).catch(() => setCriteria({ skills: [], interests: [], hobbies: [] }))
  }, [])

  useEffect(() => {
    setLoading(true)
    getStudents({
      page,
      limit,
      country: filterCountry || undefined,
      city: filterCity.trim() || undefined,
      languages: filterLanguages.length ? filterLanguages : undefined,
      certType: filterCertType || undefined,
      certMinScore: filterCertMinScore.trim() || undefined,
      skills: filterSkills.length ? filterSkills : undefined,
      interests: filterInterests.length ? filterInterests : undefined,
      hobbies: filterHobbies.length ? filterHobbies : undefined,
    })
      .then((res) => {
        setList(res.data ?? [])
        setTotal(res.total ?? 0)
      })
      .catch(() => {
        setList([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [page, filterCountry, filterCity, filterLanguages, filterCertType, filterCertMinScore, filterSkills, filterInterests, filterHobbies])

  const handleClearFilters = () => {
    setFilterCountry('')
    setFilterCity('')
    setFilterLanguages([])
    setFilterCertType('')
    setFilterCertMinScore('')
    setFilterSkills([])
    setFilterInterests([])
    setFilterHobbies([])
    setPage(1)
    setFilterModalOpen(false)
  }

  const handleApplyFilters = () => {
    setPage(1)
    setFilterModalOpen(false)
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const hasFilters =
    filterCountry ||
    filterCity.trim() ||
    filterLanguages.length > 0 ||
    filterCertType ||
    filterCertMinScore.trim() ||
    filterSkills.length > 0 ||
    filterInterests.length > 0 ||
    filterHobbies.length > 0
  const filterCount = [filterCountry, filterCity.trim(), filterLanguages.length, filterCertType, filterCertMinScore.trim(), filterSkills.length, filterInterests.length, filterHobbies.length].filter(
    (x) => (typeof x === 'number' ? x > 0 : !!x)
  ).length

  return (
    <div className="space-y-4">
      <PageTitle title={t('university:navDiscovery')} icon="Users" />
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[var(--color-text-muted)]">
          {list.length === 0 && !loading
            ? t('university:discoveryEmptyHint')
            : t('university:discoveryHint', { count: total })}
        </p>
        <Button variant="secondary" size="sm" onClick={() => setFilterModalOpen(true)} icon={<SlidersHorizontal size={16} />}>
          {t('university:filters', 'Filters')}
          {filterCount > 0 && <Badge variant="default" className="ml-1">{filterCount}</Badge>}
        </Button>
        {hasFilters && (
          <Button size="sm" variant="ghost" onClick={handleClearFilters}>
            {t('common:clear', 'Clear')}
          </Button>
        )}
      </div>

      <Modal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        title={t('university:filterByCriteria', 'Filter students')}
        footer={
          <>
            <Button variant="ghost" onClick={handleClearFilters}>{t('common:clear', 'Clear')}</Button>
            <Button onClick={handleApplyFilters}>{t('common:apply', 'Apply')}</Button>
          </>
        }
      >
        <p className="text-sm text-[var(--color-text-muted)] mb-3">
          {t('university:discoveryFilterHint', 'Search by country, city, languages, certificates (e.g. IELTS), skills, interests, hobbies.')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <Select
            label={t('common:country', 'Country')}
            options={COUNTRY_OPTIONS}
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
          />
          <Input
            label={t('common:city', 'City')}
            placeholder={t('common:city', 'City')}
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
          />
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">{t('university:languages', 'Languages')}</label>
            <ChipSelect
              options={LANGUAGE_OPTIONS}
              value={filterLanguages}
              onChange={setFilterLanguages}
              max={10}
              placeholder={t('university:languages', 'Languages')}
            />
          </div>
          <Select
            label={t('university:certType', 'Certificate')}
            options={CERT_TYPE_OPTIONS}
            value={filterCertType}
            onChange={(e) => setFilterCertType(e.target.value)}
          />
          <Input
            label={t('university:certMinScore', 'Min score')}
            type="number"
            min={0}
            max={120}
            placeholder="e.g. 6"
            value={filterCertMinScore}
            onChange={(e) => setFilterCertMinScore(e.target.value)}
          />
        </div>
        {criteria && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ChipSelect
              options={criteria.skills}
              value={filterSkills}
              onChange={setFilterSkills}
              max={20}
              placeholder={t('university:skills', 'Skills')}
            />
            <ChipSelect
              options={criteria.interests}
              value={filterInterests}
              onChange={setFilterInterests}
              max={20}
              placeholder={t('university:interests', 'Interests')}
            />
            <ChipSelect
              options={criteria.hobbies}
              value={filterHobbies}
              onChange={setFilterHobbies}
              max={20}
              placeholder={t('university:hobbies', 'Hobbies')}
            />
          </div>
        )}
      </Modal>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            title={t('university:noStudents')}
            description={t('university:discoveryEmptyDesc')}
            actionLabel={t('university:viewPipeline')}
            actionTo="/university/pipeline"
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((item) => {
              const st = item.student
              const name = [st?.firstName, st?.lastName].filter(Boolean).join(' ') || t('university:studentLabel')
              const languagesStr = st?.languages?.map((l) => `${l.language} (${l.level})`).join(', ')
              return (
                <Card key={item.id} className="flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="truncate">{name}</CardTitle>
                    {item.inPipeline && (
                      <Badge variant="success">{t('university:inPipeline', 'In pipeline')}</Badge>
                    )}
                  </div>
                  <div className="text-sm text-[var(--color-text-muted)] space-y-1">
                    {(st?.country || st?.city) && (
                      <p>{[st.country, st.city].filter(Boolean).join(', ')}</p>
                    )}
                    {st?.gpa != null && <p>GPA: {st.gpa}</p>}
                    {languagesStr && <p>{languagesStr}</p>}
                    {st?.schoolName && <p>{st.schoolName}{st.graduationYear ? ` (${st.graduationYear})` : ''}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4 pt-2">
                    <Button to={`/university/students/${encodeURIComponent(item.id)}`} variant="secondary" size="sm" icon={<User size={16} />}>
                      {t('university:viewFullProfile', 'Full profile')}
                    </Button>
                    <Button to={`/university/chat?studentId=${encodeURIComponent(item.id)}`} variant="ghost" size="sm" icon={<MessageCircle size={16} />}>
                      {t('university:navChat')}
                    </Button>
                    <Button to="/university/pipeline" variant="ghost" size="sm">
                      {t('university:viewPipeline')}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-[var(--color-text-muted)]">
                {page} / {totalPages}
              </span>
              <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
