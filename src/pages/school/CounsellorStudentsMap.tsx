import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { CircleMarker, MapContainer, Popup, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import { Building2, GraduationCap, Search, UserPlus } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { listMyStudents, listStudentUniversities, type CounsellorStudent } from '@/services/counsellor'
import { getImageUrl } from '@/services/upload'
import { useUIStore } from '@/store/uiStore'
import type { UniversityListItem } from '@/types/university'
import { cn } from '@/utils/cn'
import { getLocalizedCountryName } from '@/utils/localeDisplay'

type Coordinate = {
  lat: number
  lng: number
  precision: 'city' | 'country' | 'approximate'
}

type MapUniversity = UniversityListItem & {
  coordinates: Coordinate
  localizedCountry: string
}

const DEFAULT_CENTER: LatLngExpression = [36, 34]
const MAP_PAGE_LIMIT = 300

const COUNTRY_ALIASES: Record<string, string> = {
  australia: 'AU',
  austria: 'AT',
  belgium: 'BE',
  canada: 'CA',
  china: 'CN',
  france: 'FR',
  germany: 'DE',
  hungary: 'HU',
  latvia: 'LV',
  lithuania: 'LT',
  malaysia: 'MY',
  switzerland: 'CH',
  'united arab emirates': 'AE',
  uae: 'AE',
  uk: 'GB',
  'united kingdom': 'GB',
  usa: 'US',
  'united states': 'US',
  'united states of america': 'US',
  uzbekistan: 'UZ',
}

const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  AE: [24.4539, 54.3773],
  AT: [47.5162, 14.5501],
  AU: [-25.2744, 133.7751],
  BE: [50.5039, 4.4699],
  CA: [56.1304, -106.3468],
  CH: [46.8182, 8.2275],
  CN: [35.8617, 104.1954],
  DE: [51.1657, 10.4515],
  FR: [46.2276, 2.2137],
  GB: [55.3781, -3.436],
  HU: [47.1625, 19.5033],
  LT: [55.1694, 23.8813],
  LV: [56.8796, 24.6032],
  MY: [4.2105, 101.9758],
  US: [39.8283, -98.5795],
  UZ: [41.3775, 64.5853],
}

const CITY_COORDINATES: Record<string, [number, number]> = {
  'AE:abu dhabi': [24.4539, 54.3773],
  'AE:dubai': [25.2048, 55.2708],
  'AU:adelaide': [-34.9285, 138.6007],
  'AU:melbourne': [-37.8136, 144.9631],
  'AU:sydney': [-33.8688, 151.2093],
  'CA:toronto': [43.6532, -79.3832],
  'CA:vancouver': [49.2827, -123.1207],
  'CH:geneva': [46.2044, 6.1432],
  'CH:zurich': [47.3769, 8.5417],
  'CN:beijing': [39.9042, 116.4074],
  'CN:shanghai': [31.2304, 121.4737],
  'DE:berlin': [52.52, 13.405],
  'DE:munich': [48.1351, 11.582],
  'FR:paris': [48.8566, 2.3522],
  'GB:london': [51.5074, -0.1278],
  'GB:manchester': [53.4808, -2.2426],
  'HU:budapest': [47.4979, 19.0402],
  'LT:vilnius': [54.6872, 25.2797],
  'LV:riga': [56.9496, 24.1052],
  'MY:kuala lumpur': [3.139, 101.6869],
  'US:boston': [42.3601, -71.0589],
  'US:chicago': [41.8781, -87.6298],
  'US:los angeles': [34.0522, -118.2437],
  'US:new york': [40.7128, -74.006],
  'US:san francisco': [37.7749, -122.4194],
  'UZ:samarkand': [39.6542, 66.9597],
  'UZ:tashkent': [41.2995, 69.2401],
  '*:london': [51.5074, -0.1278],
  '*:paris': [48.8566, 2.3522],
  '*:riga': [56.9496, 24.1052],
}

function normalizeText(value?: string) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function normalizeCountryCode(country?: string) {
  const value = String(country ?? '').trim()
  if (!value) return ''
  if (/^[a-z]{2}$/i.test(value)) return value.toUpperCase()
  return COUNTRY_ALIASES[normalizeText(value)] ?? value.toUpperCase()
}

function deterministicOffset(seed: string, index: number, total: number) {
  if (total <= 1) return { lat: 0, lng: 0 }
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 9973
  }
  const angle = ((index / total) * Math.PI * 2) + ((hash % 45) * Math.PI / 180)
  const radius = Math.min(0.08, 0.025 + total * 0.006)
  return {
    lat: Math.sin(angle) * radius,
    lng: Math.cos(angle) * radius,
  }
}

function buildLocationKey(university: UniversityListItem) {
  return `${normalizeCountryCode(university.country)}:${normalizeText(university.city) || 'country'}`
}

function getUniversityCoordinate(university: UniversityListItem, index: number, totalAtLocation: number): Coordinate {
  const countryCode = normalizeCountryCode(university.country)
  const cityKey = normalizeText(university.city)
  const cityCoordinates = CITY_COORDINATES[`${countryCode}:${cityKey}`] ?? CITY_COORDINATES[`*:${cityKey}`]
  if (cityCoordinates) {
    const offset = deterministicOffset(`${countryCode}:${cityKey}:${university.id}`, index, totalAtLocation)
    return { lat: cityCoordinates[0] + offset.lat, lng: cityCoordinates[1] + offset.lng, precision: 'city' }
  }

  const countryCoordinates = COUNTRY_COORDINATES[countryCode]
  if (countryCoordinates) {
    const offset = deterministicOffset(`${countryCode}:${university.id}`, index, totalAtLocation)
    return { lat: countryCoordinates[0] + offset.lat, lng: countryCoordinates[1] + offset.lng, precision: 'country' }
  }

  const fallback = deterministicOffset(`${countryCode}:${university.city}:${university.id}`, index + 1, Math.max(totalAtLocation, 8))
  return { lat: 20 + fallback.lat * 35, lng: fallback.lng * 80, precision: 'approximate' }
}

function useMappedUniversities(universities: UniversityListItem[], locale: string): MapUniversity[] {
  return useMemo(() => {
    const locationCounts = new Map<string, number>()
    const locationIndexes = new Map<string, number>()
    universities.forEach((university) => {
      const key = buildLocationKey(university)
      locationCounts.set(key, (locationCounts.get(key) ?? 0) + 1)
    })

    return universities.map((university) => {
      const key = buildLocationKey(university)
      const currentIndex = locationIndexes.get(key) ?? 0
      locationIndexes.set(key, currentIndex + 1)
      return {
        ...university,
        coordinates: getUniversityCoordinate(university, currentIndex, locationCounts.get(key) ?? 1),
        localizedCountry: university.country ? getLocalizedCountryName(university.country, locale) : '',
      }
    })
  }, [locale, universities])
}

function MapFocus({ selected }: { selected?: MapUniversity }) {
  const map = useMap()

  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 0)
  }, [map])

  useEffect(() => {
    if (!selected) return
    map.setView([selected.coordinates.lat, selected.coordinates.lng], Math.max(map.getZoom(), 5), {
      animate: true,
      duration: 0.6,
    })
  }, [map, selected])

  return null
}

function studentLabel(student: CounsellorStudent) {
  return student.name || [student.firstName, student.lastName].filter(Boolean).join(' ') || student.email
}

function studentUserId(student: CounsellorStudent) {
  return String(student.userId || '')
}

export function CounsellorStudentsMap() {
  const { t, i18n } = useTranslation(['common', 'student', 'school', 'documents'])
  const theme = useUIStore((state) => state.theme)
  const [draftStudentId, setDraftStudentId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [scholarshipFilter, setScholarshipFilter] = useState<'all' | 'with' | 'without'>('all')
  const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(null)

  const { data: studentsRes, isLoading: studentsLoading } = useQuery({
    queryKey: ['counsellor', 'students', 'map-selector'],
    queryFn: () => listMyStudents({ page: 1, limit: 300 }),
    staleTime: 60 * 1000,
  })
  const students = studentsRes?.data ?? []
  const studentOptions = useMemo(
    () => students
      .map((student) => ({ value: studentUserId(student), label: studentLabel(student) }))
      .filter((option) => option.value),
    [students]
  )

  useEffect(() => {
    if (draftStudentId || studentOptions.length === 0) return
    setDraftStudentId(studentOptions[0].value)
  }, [draftStudentId, studentOptions])

  const { data: universitiesRes, isLoading: universitiesLoading, isFetching } = useQuery({
    queryKey: ['counsellor', 'student-universities-map', selectedStudentId, scholarshipFilter],
    queryFn: () => listStudentUniversities(selectedStudentId, {
      page: 1,
      limit: MAP_PAGE_LIMIT,
      hasScholarship: scholarshipFilter === 'with' ? true : undefined,
      useProfileFilters: true,
    }),
    enabled: Boolean(selectedStudentId),
    staleTime: 30 * 1000,
  })

  const rawUniversities = universitiesRes?.data ?? []
  const mappedUniversities = useMappedUniversities(rawUniversities, i18n.language)
  const countryOptions = useMemo(() => {
    const map = new Map<string, string>()
    mappedUniversities.forEach((university) => {
      if (!university.country) return
      const code = normalizeCountryCode(university.country)
      map.set(code, university.localizedCountry || university.country)
    })
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], i18n.language))
  }, [i18n.language, mappedUniversities])

  const filteredUniversities = useMemo(() => {
    const query = normalizeText(search)
    return mappedUniversities.filter((university) => {
      if (scholarshipFilter === 'without' && university.hasScholarship) return false
      if (country && normalizeCountryCode(university.country) !== country) return false
      if (!query) return true
      const haystack = normalizeText([university.name, university.city, university.localizedCountry, university.description].filter(Boolean).join(' '))
      return haystack.includes(query)
    })
  }, [country, mappedUniversities, scholarshipFilter, search])

  const selectedUniversity = filteredUniversities.find((university) => university.id === selectedUniversityId) ?? filteredUniversities[0]
  const selectedStudent = students.find((student) => studentUserId(student) === selectedStudentId)
  const tileUrl = theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  const handleShowUniversities = () => {
    setSelectedStudentId(draftStudentId)
    setSearch('')
    setCountry('')
    setScholarshipFilter('all')
    setSelectedUniversityId(null)
  }

  return (
    <div className="space-y-5 pb-5">
      <Card className="space-y-3">
        {studentsLoading ? (
          <p className="text-sm text-[var(--color-text-muted)]">{t('school:loadingStudents', 'Loading students...')}</p>
        ) : studentOptions.length === 0 ? (
          <EmptyState
            icon={<UserPlus className="h-12 w-12 text-[var(--color-text-muted)] opacity-70" />}
            title={t('school:noStudentsYet', 'No students yet')}
            description={t('school:studentInterestsNoStudentsHint', 'Create or invite students first to send interests.')}
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <Select
              label={t('school:student', 'Student')}
              value={draftStudentId}
              onChange={(event) => setDraftStudentId(event.target.value)}
              options={[
                { value: '', label: t('school:selectStudent', 'Select a student') },
                ...studentOptions,
              ]}
              disabled={studentsLoading}
            />
            <Button className="min-h-[44px]" onClick={handleShowUniversities} disabled={!draftStudentId}>
              {t('school:showUniversities', 'Show universities')}
            </Button>
          </div>
        )}
        {selectedStudent ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{studentLabel(selectedStudent)}</Badge>
            <Badge>{filteredUniversities.length} {t('student:mapResults', 'on map')}</Badge>
            {isFetching && !universitiesLoading ? <Badge>{t('common:loading', 'Loading...')}</Badge> : null}
          </div>
        ) : null}
      </Card>

      {!selectedStudentId ? (
        <Card>
          <EmptyState
            icon={<GraduationCap className="h-14 w-14 text-[var(--color-text-muted)] opacity-70" />}
            title={t('school:selectStudentFirst', 'Select a student first')}
            description={t('school:selectStudentFirstHint', 'Choose a student and click Show universities to see matched universities on the map.')}
          />
        </Card>
      ) : (
        <>
          <Card className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_240px] lg:items-end">
              <Input
                label={t('common:search', 'Search')}
                placeholder={t('student:mapSearchPlaceholder', 'Search university, city, or country')}
                value={search}
                left={<Search size={18} />}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Select
                label={t('student:country', 'Country')}
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                placeholder={t('student:allCountries', 'All countries')}
                options={countryOptions.map(([code, label]) => ({ value: code, label }))}
              />
              <Select
                label={t('documents:type.scholarship', 'Scholarship')}
                value={scholarshipFilter}
                onChange={(event) => {
                  setScholarshipFilter(event.target.value as 'all' | 'with' | 'without')
                  setSelectedUniversityId(null)
                }}
                options={[
                  { value: 'all', label: t('school:allUniversities', 'All universities') },
                  { value: 'with', label: t('school:withScholarship', 'With scholarship') },
                  { value: 'without', label: t('school:withoutScholarship', 'Without scholarship') },
                ]}
              />
            </div>
          </Card>

          {universitiesLoading ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
              <Skeleton className="min-h-[520px] rounded-card" />
              <Skeleton className="min-h-[520px] rounded-card" />
            </div>
          ) : filteredUniversities.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Building2 className="h-14 w-14 text-[var(--color-text-muted)] opacity-70" />}
                title={t('student:noUniversitiesFound', 'No universities found')}
                description={t('student:tryChangingFiltersOrSearch', 'Try changing filters or search to see more results.')}
                actionLabel={t('student:clearFilters', 'Clear filters')}
                onAction={() => {
                  setSearch('')
                  setCountry('')
                  setScholarshipFilter('all')
                }}
              />
            </Card>
          ) : (
            <div className="grid gap-4 lg:h-[min(600px,calc(100dvh-235px))] lg:min-h-[460px] lg:grid-cols-[minmax(0,1fr)_380px] lg:overflow-hidden">
              <div className="min-h-[520px] overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)] lg:h-full lg:min-h-0">
                <MapContainer
                  key={theme}
                  center={DEFAULT_CENTER}
                  zoom={3}
                  minZoom={2}
                  maxZoom={18}
                  maxBounds={[[-90, -180], [90, 180]]}
                  zoomControl={false}
                  className="edmission-university-map h-[520px] w-full lg:h-full"
                >
                  <TileLayer attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>' url={tileUrl} />
                  <ZoomControl position="topright" />
                  <MapFocus selected={selectedUniversity} />
                  {filteredUniversities.map((university) => {
                    const isSelected = university.id === selectedUniversity?.id
                    return (
                      <CircleMarker
                        key={university.id}
                        center={[university.coordinates.lat, university.coordinates.lng]}
                        radius={isSelected ? 13 : university.hasScholarship ? 10 : 8}
                        pathOptions={{
                          color: isSelected ? '#84cc16' : '#2563eb',
                          fillColor: university.hasScholarship ? '#10b981' : '#2563eb',
                          fillOpacity: isSelected ? 0.9 : 0.68,
                          opacity: 0.9,
                          weight: isSelected ? 3 : 2,
                        }}
                        eventHandlers={{
                          click: () => setSelectedUniversityId(university.id),
                          mouseover: (event) => event.target.openPopup(),
                        }}
                      >
                        <Popup closeButton={false}>
                          <UniversityPopup university={university} />
                        </Popup>
                      </CircleMarker>
                    )
                  })}
                </MapContainer>
              </div>

              <aside className="flex min-h-0 flex-col rounded-card border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)] lg:h-full lg:overflow-hidden">
                <div className="border-b border-[var(--color-border)] p-4">
                  <h2 className="text-base font-semibold text-[var(--color-text)]">
                    {t('school:studentUniversitiesOnMap', 'Universities for this student')}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {t('school:studentUniversitiesOnMapHint', 'Select a university to move the map and review it.')}
                  </p>
                </div>
                <div className="max-h-[520px] min-h-0 flex-1 space-y-2 overflow-y-auto p-3 lg:max-h-none">
                  {filteredUniversities.map((university) => (
                    <button
                      key={university.id}
                      type="button"
                      onClick={() => setSelectedUniversityId(university.id)}
                      className={cn(
                        'w-full rounded-[14px] border p-3 text-left transition-colors duration-200',
                        selectedUniversity?.id === university.id
                          ? 'border-primary-accent bg-primary-accent/10'
                          : 'border-[var(--color-border)] hover:bg-[var(--color-border)]/35'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <UniversityLogo university={university} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[var(--color-text)]">{university.name}</p>
                          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                            {[university.city, university.localizedCountry].filter(Boolean).join(', ') || t('student:locationNotSet', 'Location not set')}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {university.hasScholarship ? (
                              <Badge variant="success" className="px-2 py-0 text-[11px]">{t('student:cardScholarshipAvailable', 'Available')}</Badge>
                            ) : null}
                            {university.coordinates.precision !== 'city' ? (
                              <Badge className="px-2 py-0 text-[11px]">{t('student:countryLevelLocation', 'Country level')}</Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function UniversityLogo({ university }: { university: UniversityListItem }) {
  const logoUrl = university.logo ? getImageUrl(university.logo) : ''
  if (logoUrl) {
    return (
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-white p-1">
        <img src={logoUrl} alt="" className="h-full w-full object-contain" loading="lazy" />
      </span>
    )
  }

  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-[var(--color-border)] bg-[var(--color-border)]/45 text-[var(--color-text-muted)]">
      <GraduationCap size={20} />
    </span>
  )
}

function UniversityPopup({ university }: { university: MapUniversity }) {
  const { t } = useTranslation(['student', 'common'])
  return (
    <div className="w-56 rounded-[12px] bg-[var(--color-card)] p-3 text-[var(--color-text)]">
      <div className="flex items-start gap-3">
        <UniversityLogo university={university} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold">{university.name}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {[university.city, university.localizedCountry].filter(Boolean).join(', ')}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-[10px] bg-[var(--color-bg)] px-2 py-1.5">
          <span className="block text-[var(--color-text-muted)]">{t('student:cardTuitionLabel', 'Tuition')}</span>
          <span className="font-medium">
            {university.tuitionPrice != null ? `$${university.tuitionPrice.toLocaleString()}` : '-'}
          </span>
        </div>
        <div className="rounded-[10px] bg-[var(--color-bg)] px-2 py-1.5">
          <span className="block text-[var(--color-text-muted)]">{t('student:compareScholarship', 'Scholarship')}</span>
          <span className="font-medium">{university.hasScholarship ? t('common:yes', 'Yes') : '-'}</span>
        </div>
      </div>
    </div>
  )
}
