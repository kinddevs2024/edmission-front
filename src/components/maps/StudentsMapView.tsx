import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { CircleMarker, MapContainer, Popup, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import { GraduationCap, MapPin, Maximize2, MessageCircle, Minimize2, Search, Sparkles, User, X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { getStudentAvatarUrl } from '@/services/upload'
import { useUIStore } from '@/store/uiStore'
import { getLocalizedCountryName } from '@/utils/localeDisplay'
import { cn } from '@/utils/cn'

type Coordinate = {
  lat: number
  lng: number
  precision: 'city' | 'country' | 'approximate'
}

export type StudentMapItem = {
  id: string
  name: string
  email?: string
  country?: string
  city?: string
  avatarUrl?: string
  schoolName?: string
  gpa?: number
  graduationYear?: number
  verified?: boolean
  highlighted?: boolean
  detailTo: string
  chatTo?: string
}

type MappedStudent = StudentMapItem & {
  coordinates: Coordinate
  localizedCountry: string
}

type StudentsMapViewProps = {
  queryKey: readonly unknown[]
  queryFn: () => Promise<StudentMapItem[]>
  introStorageKey: string
  eyebrow: string
  title: string
  description: string
  panelTitle: string
  panelHint: string
  emptyTitle: string
  emptyDescription: string
}

const DEFAULT_CENTER: LatLngExpression = [36, 34]

const COUNTRY_ALIASES: Record<string, string> = {
  australia: 'AU',
  austria: 'AT',
  belgium: 'BE',
  canada: 'CA',
  china: 'CN',
  czechia: 'CZ',
  'czech republic': 'CZ',
  denmark: 'DK',
  estonia: 'EE',
  finland: 'FI',
  france: 'FR',
  germany: 'DE',
  greece: 'GR',
  hungary: 'HU',
  ireland: 'IE',
  italy: 'IT',
  japan: 'JP',
  kazakhstan: 'KZ',
  latvia: 'LV',
  lithuania: 'LT',
  malaysia: 'MY',
  netherlands: 'NL',
  'new zealand': 'NZ',
  norway: 'NO',
  poland: 'PL',
  portugal: 'PT',
  romania: 'RO',
  russia: 'RU',
  'russian federation': 'RU',
  singapore: 'SG',
  slovakia: 'SK',
  'south korea': 'KR',
  spain: 'ES',
  sweden: 'SE',
  switzerland: 'CH',
  turkey: 'TR',
  turkiye: 'TR',
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
  AU: [-25.2744, 133.7751],
  AT: [47.5162, 14.5501],
  BE: [50.5039, 4.4699],
  CA: [56.1304, -106.3468],
  CH: [46.8182, 8.2275],
  CN: [35.8617, 104.1954],
  CZ: [49.8175, 15.473],
  DK: [56.2639, 9.5018],
  DE: [51.1657, 10.4515],
  EE: [58.5953, 25.0136],
  ES: [40.4637, -3.7492],
  FI: [61.9241, 25.7482],
  FR: [46.2276, 2.2137],
  GB: [55.3781, -3.436],
  GR: [39.0742, 21.8243],
  HU: [47.1625, 19.5033],
  IE: [53.4129, -8.2439],
  IT: [41.8719, 12.5674],
  JP: [36.2048, 138.2529],
  KR: [35.9078, 127.7669],
  KZ: [48.0196, 66.9237],
  LT: [55.1694, 23.8813],
  LV: [56.8796, 24.6032],
  MY: [4.2105, 101.9758],
  NL: [52.1326, 5.2913],
  NO: [60.472, 8.4689],
  NZ: [-40.9006, 174.886],
  PL: [51.9194, 19.1451],
  PT: [39.3999, -8.2245],
  RO: [45.9432, 24.9668],
  RU: [61.524, 105.3188],
  SE: [60.1282, 18.6435],
  SG: [1.3521, 103.8198],
  SK: [48.669, 19.699],
  TR: [38.9637, 35.2433],
  US: [39.8283, -98.5795],
  UZ: [41.3775, 64.5853],
}

const CITY_COORDINATES: Record<string, [number, number]> = {
  'AE:abu dhabi': [24.4539, 54.3773],
  'AE:dubai': [25.2048, 55.2708],
  'AU:adelaide': [-34.9285, 138.6007],
  'AU:brisbane': [-27.4698, 153.0251],
  'AU:melbourne': [-37.8136, 144.9631],
  'AU:perth': [-31.9523, 115.8613],
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

function deterministicOffset(seed: string, index: number, total: number, options?: { base?: number; perItem?: number; max?: number }) {
  if (total <= 1) return { lat: 0, lng: 0 }
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 9973
  }
  const angle = ((index / total) * Math.PI * 2) + ((hash % 45) * Math.PI / 180)
  const radius = Math.min(options?.max ?? 0.42, (options?.base ?? 0.12) + total * (options?.perItem ?? 0.025))
  return {
    lat: Math.sin(angle) * radius,
    lng: Math.cos(angle) * radius,
  }
}

function buildLocationKey(student: StudentMapItem) {
  return `${normalizeCountryCode(student.country)}:${normalizeText(student.city) || 'country'}`
}

function getStudentCoordinate(student: StudentMapItem, index: number, totalAtLocation: number): Coordinate {
  const countryCode = normalizeCountryCode(student.country)
  const cityKey = normalizeText(student.city)
  const cityCoordinates = CITY_COORDINATES[`${countryCode}:${cityKey}`] ?? CITY_COORDINATES[`*:${cityKey}`]
  if (cityCoordinates) {
    const offset = deterministicOffset(`${countryCode}:${cityKey}:${student.id}`, index, totalAtLocation, { base: 0.025, perItem: 0.006, max: 0.08 })
    return { lat: cityCoordinates[0] + offset.lat, lng: cityCoordinates[1] + offset.lng, precision: 'city' }
  }

  const countryCoordinates = COUNTRY_COORDINATES[countryCode]
  if (countryCoordinates) {
    const offset = deterministicOffset(`${countryCode}:${student.id}`, index, totalAtLocation)
    return { lat: countryCoordinates[0] + offset.lat, lng: countryCoordinates[1] + offset.lng, precision: 'country' }
  }

  const fallback = deterministicOffset(`${countryCode}:${student.city}:${student.id}`, index + 1, Math.max(totalAtLocation, 8))
  return { lat: 20 + fallback.lat * 35, lng: fallback.lng * 80, precision: 'approximate' }
}

function useMappedStudents(students: StudentMapItem[], locale: string): MappedStudent[] {
  return useMemo(() => {
    const locationCounts = new Map<string, number>()
    const locationIndexes = new Map<string, number>()
    students.forEach((student) => {
      const key = buildLocationKey(student)
      locationCounts.set(key, (locationCounts.get(key) ?? 0) + 1)
    })

    return students.map((student) => {
      const key = buildLocationKey(student)
      const currentIndex = locationIndexes.get(key) ?? 0
      locationIndexes.set(key, currentIndex + 1)
      return {
        ...student,
        coordinates: getStudentCoordinate(student, currentIndex, locationCounts.get(key) ?? 1),
        localizedCountry: student.country ? getLocalizedCountryName(student.country, locale) : '',
      }
    })
  }, [locale, students])
}

function MapFocus({ selected }: { selected?: MappedStudent }) {
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

export function StudentsMapView({
  queryKey,
  queryFn,
  introStorageKey,
  eyebrow,
  title,
  description,
  panelTitle,
  panelHint,
  emptyTitle,
  emptyDescription,
}: StudentsMapViewProps) {
  const { t, i18n } = useTranslation(['common', 'student', 'university', 'school'])
  const theme = useUIStore((state) => state.theme)
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)
  const [introDismissed, setIntroDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(introStorageKey) === '1'
  })

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn,
    staleTime: 60 * 1000,
  })

  const students = data ?? []
  const mappedStudents = useMappedStudents(students, i18n.language)
  const countryOptions = useMemo(() => {
    const map = new Map<string, string>()
    mappedStudents.forEach((student) => {
      if (!student.country) return
      const code = normalizeCountryCode(student.country)
      map.set(code, student.localizedCountry || student.country)
    })
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], i18n.language))
  }, [i18n.language, mappedStudents])

  const filteredStudents = useMemo(() => {
    const query = normalizeText(search)
    return mappedStudents.filter((student) => {
      const countryCode = normalizeCountryCode(student.country)
      if (country && countryCode !== country) return false
      if (!query) return true
      const haystack = normalizeText([
        student.name,
        student.email,
        student.city,
        student.localizedCountry,
        student.schoolName,
      ].filter(Boolean).join(' '))
      return haystack.includes(query)
    })
  }, [country, mappedStudents, search])

  const selectedStudent = filteredStudents.find((student) => student.id === selectedId) ?? filteredStudents[0]
  const countriesCount = new Set(filteredStudents.map((student) => normalizeCountryCode(student.country)).filter(Boolean)).size
  const citiesCount = new Set(filteredStudents.map((student) => buildLocationKey(student))).size
  const verifiedCount = filteredStudents.filter((student) => student.verified).length
  const tileUrl = theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  useEffect(() => {
    if (!isMapFullscreen || typeof document === 'undefined') return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMapFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMapFullscreen])

  const renderStudentMarkers = () => filteredStudents.map((student) => {
    const isSelected = student.id === selectedStudent?.id
    const radius = isSelected ? 13 : student.highlighted || student.verified ? 10 : 8
    return (
      <CircleMarker
        key={student.id}
        center={[student.coordinates.lat, student.coordinates.lng]}
        radius={radius}
        pathOptions={{
          color: isSelected ? '#84cc16' : '#2563eb',
          fillColor: student.verified ? '#10b981' : student.highlighted ? '#0ea5e9' : '#2563eb',
          fillOpacity: isSelected ? 0.9 : 0.68,
          opacity: 0.9,
          weight: isSelected ? 3 : 2,
        }}
        eventHandlers={{
          click: () => setSelectedId(student.id),
          mouseover: (event) => event.target.openPopup(),
        }}
      >
        <Popup closeButton={false}>
          <StudentPopup student={student} />
        </Popup>
      </CircleMarker>
    )
  })

  const renderStudentList = () => filteredStudents.map((student) => (
    <button
      key={student.id}
      type="button"
      onClick={() => setSelectedId(student.id)}
      className={cn(
        'w-full rounded-[14px] border p-3 text-left transition-colors duration-200',
        selectedStudent?.id === student.id
          ? 'border-primary-accent bg-primary-accent/10'
          : 'border-[var(--color-border)] hover:bg-[var(--color-border)]/35'
      )}
    >
      <div className="flex items-start gap-3">
        <StudentAvatar student={student} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--color-text)]">{student.name}</p>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            {[student.city, student.localizedCountry].filter(Boolean).join(', ') || t('student:locationNotSet', 'Location not set')}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {student.verified ? (
              <Badge variant="success" className="px-2 py-0 text-[11px]">{t('university:verified', 'Verified')}</Badge>
            ) : null}
            {student.highlighted ? (
              <Badge variant="info" className="px-2 py-0 text-[11px]">{t('university:inPipeline', 'In pipeline')}</Badge>
            ) : null}
            {student.coordinates.precision !== 'city' ? (
              <Badge className="px-2 py-0 text-[11px]">{t('student:countryLevelLocation', 'Country level')}</Badge>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  ))

  const fullscreenMap = isMapFullscreen && filteredStudents.length > 0 && typeof document !== 'undefined'
    ? createPortal(
      <div className="fixed inset-0 z-[9999] bg-[var(--color-bg)] text-[var(--color-text)]">
        <div className="grid h-dvh grid-rows-[minmax(190px,34dvh)_minmax(0,1fr)] lg:grid-cols-[380px_minmax(0,1fr)] lg:grid-rows-1">
          <aside className="order-2 flex min-h-0 flex-col border-t border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)] lg:order-1 lg:border-r lg:border-t-0">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] p-4">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold">{panelTitle}</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {filteredStudents.length} {t('student:mapResults', 'on map')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMapFullscreen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-muted)] transition-colors duration-200 hover:bg-[var(--color-border)] hover:text-[var(--color-text)]"
                aria-label={t('student:reduceMap', 'Reduce map')}
              >
                <Minimize2 size={16} />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {renderStudentList()}
            </div>
          </aside>
          <div className="relative order-1 min-h-0 overflow-hidden bg-[var(--color-card)] lg:order-2">
            <button
              type="button"
              onClick={() => setIsMapFullscreen(false)}
              className="absolute right-4 top-4 z-[500] hidden h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/92 text-[var(--color-text-muted)] shadow-sm backdrop-blur transition-colors duration-200 hover:bg-[var(--color-border)] hover:text-[var(--color-text)] lg:inline-flex"
              aria-label={t('student:reduceMap', 'Reduce map')}
            >
              <Minimize2 size={18} />
            </button>
            <MapContainer
              key={`${theme}-students-fullscreen`}
              center={selectedStudent ? [selectedStudent.coordinates.lat, selectedStudent.coordinates.lng] : DEFAULT_CENTER}
              zoom={selectedStudent ? 5 : 3}
              minZoom={2}
              maxZoom={18}
              maxBounds={[[-90, -180], [90, 180]]}
              zoomControl={false}
              className="edmission-university-map h-full w-full"
            >
              <TileLayer attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>' url={tileUrl} />
              <ZoomControl position="topright" />
              <MapFocus selected={selectedStudent} />
              {renderStudentMarkers()}
            </MapContainer>
          </div>
        </div>
      </div>,
      document.body
    )
    : null

  return (
    <div className="space-y-5 pb-5">
      {!introDismissed ? (
        <Card className="relative overflow-hidden bg-[linear-gradient(135deg,rgba(132,204,22,0.08),rgba(59,130,246,0.06)_48%,rgba(255,255,255,0.92))] px-4 py-5 pr-12 dark:bg-[linear-gradient(135deg,rgba(132,204,22,0.12),rgba(59,130,246,0.08)_48%,rgba(17,24,39,0.96))]">
          <button
            type="button"
            onClick={() => {
              setIntroDismissed(true)
              window.localStorage.setItem(introStorageKey, '1')
            }}
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/90 text-[var(--color-text-muted)] transition-colors duration-200 hover:bg-[var(--color-border)] hover:text-[var(--color-text)]"
            aria-label={t('common:close', 'Close')}
          >
            <X size={16} />
          </button>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                <MapPin size={14} />
                {eyebrow}
              </div>
              <h1 className="text-2xl font-semibold tracking-normal text-[var(--color-text)] sm:text-3xl">{title}</h1>
              <p className="max-w-2xl text-sm leading-6 text-[var(--color-text-muted)] sm:text-base">{description}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
              <MapStat label={t('university:students', 'Students')} value={filteredStudents.length} />
              <MapStat label={t('student:countries', 'Countries')} value={countriesCount} />
              <MapStat label={t('student:cities', 'Cities')} value={citiesCount} />
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
          <Input
            label={t('common:search', 'Search')}
            placeholder={t('university:studentMapSearchPlaceholder', 'Search student, city, country, or school')}
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
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">{filteredStudents.length} {t('student:mapResults', 'on map')}</Badge>
          <Badge variant="success">{verifiedCount} {t('university:verified', 'Verified')}</Badge>
          {isFetching && !isLoading ? <Badge>{t('common:loading', 'Loading...')}</Badge> : null}
        </div>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="min-h-[520px] rounded-card" />
          <Skeleton className="min-h-[520px] rounded-card" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <Card>
          <EmptyState
            icon={<GraduationCap className="h-14 w-14 text-[var(--color-text-muted)] opacity-70" />}
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={t('student:clearFilters', 'Clear filters')}
            onAction={() => {
              setSearch('')
              setCountry('')
            }}
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:h-[min(600px,calc(100dvh-235px))] lg:min-h-[460px] lg:grid-cols-[minmax(0,1fr)_380px] lg:overflow-hidden">
          <div className="relative min-h-[520px] overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)] lg:h-full lg:min-h-0">
            <button
              type="button"
              onClick={() => setIsMapFullscreen(true)}
              className="absolute left-3 top-3 z-[500] inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/92 text-[var(--color-text)] shadow-sm backdrop-blur transition-colors duration-200 hover:bg-primary-accent/12 hover:text-primary-accent"
              aria-label={t('student:openMapFullscreen', 'Open full-screen map')}
            >
              <Maximize2 size={18} />
            </button>
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
              <MapFocus selected={selectedStudent} />
              {renderStudentMarkers()}
            </MapContainer>
          </div>

          <aside className="flex min-h-0 flex-col rounded-card border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)] lg:h-full lg:overflow-hidden">
            <div className="border-b border-[var(--color-border)] p-4">
              <h2 className="text-base font-semibold text-[var(--color-text)]">{panelTitle}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{panelHint}</p>
            </div>
            <div className="max-h-[520px] min-h-0 flex-1 space-y-2 overflow-y-auto p-3 lg:max-h-none">
              {renderStudentList()}
            </div>
          </aside>
        </div>
      )}

      {fullscreenMap}
    </div>
  )
}

function MapStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[14px] border border-[var(--color-border)] bg-[var(--color-card)]/88 px-3 py-2 shadow-sm">
      <p className="text-lg font-semibold tabular-nums text-[var(--color-text)]">{value.toLocaleString()}</p>
      <p className="truncate text-xs text-[var(--color-text-muted)]">{label}</p>
    </div>
  )
}

function StudentAvatar({ student }: { student: StudentMapItem }) {
  const avatarUrl = getStudentAvatarUrl(student.avatarUrl)
  if (avatarUrl) {
    return (
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-white">
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
      </span>
    )
  }

  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-[var(--color-border)] bg-[var(--color-border)]/45 text-[var(--color-text-muted)]">
      <User size={20} />
    </span>
  )
}

function StudentPopup({ student }: { student: MappedStudent }) {
  const { t } = useTranslation(['common', 'student', 'university'])
  return (
    <div className="w-56 rounded-[12px] bg-[var(--color-card)] p-3 text-[var(--color-text)]">
      <div className="flex items-start gap-3">
        <StudentAvatar student={student} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold">{student.name}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {[student.city, student.localizedCountry].filter(Boolean).join(', ')}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-[10px] bg-[var(--color-bg)] px-2 py-1.5">
          <span className="block text-[var(--color-text-muted)]">GPA</span>
          <span className="font-medium">{student.gpa != null ? student.gpa : '-'}</span>
        </div>
        <div className="rounded-[10px] bg-[var(--color-bg)] px-2 py-1.5">
          <span className="block text-[var(--color-text-muted)]">{t('university:verified', 'Verified')}</span>
          <span className="font-medium">{student.verified ? t('common:yes', 'Yes') : '-'}</span>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button to={student.detailTo} variant="secondary" size="sm" className="flex-1" icon={<Sparkles size={14} />}>
          {t('common:details', 'Details')}
        </Button>
        {student.chatTo ? (
          <Button to={student.chatTo} variant="ghost" size="sm" icon={<MessageCircle size={14} />} aria-label={t('university:navChat', 'Chat')} />
        ) : null}
      </div>
    </div>
  )
}
