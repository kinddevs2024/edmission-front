import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PageTitle } from '@/components/ui/PageTitle'
import { ChipSelect } from '@/components/ui/ChipSelect'
import {
  getAdminCatalogUniversities,
  createCatalogUniversity,
  getCatalogUniversity,
  updateCatalogUniversity,
  type AdminCatalogUniversity,
} from '@/services/admin'
import { FIELD_OF_STUDY } from '@/constants/fieldOfStudy'
import { Plus, Trash2 } from 'lucide-react'

const COUNTRY_OPTIONS = [
  { code: 'UZ', label: 'Uzbekistan' },
  { code: 'KZ', label: 'Kazakhstan' },
  { code: 'TJ', label: 'Tajikistan' },
  { code: 'KG', label: 'Kyrgyzstan' },
  { code: 'TM', label: 'Turkmenistan' },
  { code: 'TR', label: 'Turkey' },
  { code: 'AE', label: 'UAE' },
  { code: 'CN', label: 'China' },
] as const

export function AdminUniversities() {
  const { t } = useTranslation(['common', 'admin', 'university'])
  const [list, setList] = useState<AdminCatalogUniversity[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const limit = 20

  const [formName, setFormName] = useState('')
  const [formCountry, setFormCountry] = useState('')
  const [formCity, setFormCity] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formLogoUrl, setFormLogoUrl] = useState('')
  const [formTagline, setFormTagline] = useState('')
  const [formEstablishedYear, setFormEstablishedYear] = useState('')
  const [formStudentCount, setFormStudentCount] = useState('')
  const [formFacultyCodes, setFormFacultyCodes] = useState<string[]>([])
  const [formFacultyItems, setFormFacultyItems] = useState<Record<string, string[]>>({})
  const [formTargetCountries, setFormTargetCountries] = useState<string[]>([])
  const [openFacultyId, setOpenFacultyId] = useState<string | null>(null)
  const [formPrograms, setFormPrograms] = useState<Array<{ name: string; degreeLevel: string; field: string; durationYears?: number; tuitionFee?: number; language?: string; entryRequirements?: string }>>([])
  const [formScholarships, setFormScholarships] = useState<Array<{ name: string; coveragePercent: number; maxSlots: number; deadline?: string; eligibility?: string }>>([])
  const [showPrograms, setShowPrograms] = useState(false)
  const [showScholarships, setShowScholarships] = useState(false)

  const load = () => {
    setLoading(true)
    getAdminCatalogUniversities({ page, limit, search: search.trim() || undefined })
      .then((res) => {
        setList(res.data)
        setTotal(res.total)
      })
      .catch(() => {
        setList([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, search])

  const openAdd = () => {
    setFormName('')
    setFormCountry('')
    setFormCity('')
    setFormDescription('')
    setFormLogoUrl('')
    setFormTagline('')
    setFormEstablishedYear('')
    setFormStudentCount('')
    setFormFacultyCodes([])
    setFormFacultyItems({})
    setFormTargetCountries([])
    setFormPrograms([])
    setFormScholarships([])
    setModal('add')
    setEditingId(null)
  }

  const openEdit = (id: string) => {
    setEditingId(id)
    setModal('edit')
    getCatalogUniversity(id).then((u) => {
      setFormName(u.name ?? u.universityName ?? '')
      setFormCountry(u.country ?? '')
      setFormCity(u.city ?? '')
      setFormDescription(u.description ?? '')
      setFormLogoUrl(u.logoUrl ?? '')
      setFormTagline(u.tagline ?? '')
      setFormEstablishedYear(u.establishedYear != null ? String(u.establishedYear) : '')
      setFormStudentCount(u.studentCount != null ? String(u.studentCount) : '')
      setFormFacultyCodes(u.facultyCodes ?? [])
      setFormFacultyItems((u as { facultyItems?: Record<string, string[]> }).facultyItems ?? {})
      setFormTargetCountries(u.targetStudentCountries ?? [])
      const progs = (u as { programs?: Array<Record<string, unknown>> }).programs ?? []
      setFormPrograms(progs.map((p) => ({
        name: String(p.name ?? ''),
        degreeLevel: String(p.degreeLevel ?? ''),
        field: String(p.field ?? ''),
        durationYears: p.durationYears != null ? Number(p.durationYears) : undefined,
        tuitionFee: p.tuitionFee != null ? Number(p.tuitionFee) : undefined,
        language: p.language != null ? String(p.language) : undefined,
        entryRequirements: p.entryRequirements != null ? String(p.entryRequirements) : undefined,
      })))
      const schs = (u as { scholarships?: Array<Record<string, unknown>> }).scholarships ?? []
      setFormScholarships(schs.map((s) => ({
        name: String(s.name ?? ''),
        coveragePercent: s.coveragePercent != null ? Number(s.coveragePercent) : 0,
        maxSlots: s.maxSlots != null ? Number(s.maxSlots) : 0,
        deadline: s.deadline ? String(s.deadline).slice(0, 10) : undefined,
        eligibility: s.eligibility != null ? String(s.eligibility) : undefined,
      })))
      setShowPrograms(progs.length > 0)
      setShowScholarships(schs.length > 0)
    })
  }

  const handleSubmit = () => {
    if (!formName.trim()) return
    setSubmitting(true)
    const body: Record<string, unknown> = {
      universityName: formName.trim(),
      country: formCountry.trim() || undefined,
      city: formCity.trim() || undefined,
      description: formDescription.trim() || undefined,
      logoUrl: formLogoUrl.trim() || undefined,
      tagline: formTagline.trim() || undefined,
      establishedYear: formEstablishedYear ? Number(formEstablishedYear) : undefined,
      studentCount: formStudentCount ? Number(formStudentCount) : undefined,
      facultyCodes: formFacultyCodes.length ? formFacultyCodes : undefined,
      facultyItems: Object.keys(formFacultyItems).length ? formFacultyItems : undefined,
      targetStudentCountries: formTargetCountries.length ? formTargetCountries : undefined,
      programs: formPrograms.filter((p) => p.name.trim()).map((p) => ({
        name: p.name.trim(),
        degreeLevel: p.degreeLevel.trim() || undefined,
        field: p.field.trim() || undefined,
        durationYears: p.durationYears,
        tuitionFee: p.tuitionFee,
        language: p.language?.trim() || undefined,
        entryRequirements: p.entryRequirements?.trim() || undefined,
      })),
      scholarships: formScholarships.filter((s) => s.name.trim()).map((s) => ({
        name: s.name.trim(),
        coveragePercent: s.coveragePercent,
        maxSlots: s.maxSlots,
        deadline: s.deadline || undefined,
        eligibility: s.eligibility?.trim() || undefined,
      })),
    }
    const promise =
      modal === 'add'
        ? createCatalogUniversity(body)
        : editingId
          ? updateCatalogUniversity(editingId, body)
          : Promise.reject(new Error('No id'))
    promise
      .then(() => {
        setModal(null)
        setEditingId(null)
        load()
      })
      .catch(() => {})
      .finally(() => setSubmitting(false))
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-4">
      <PageTitle title={t('admin:universityCatalog', 'University catalog')} icon="Building2">
        <Button size="sm" onClick={openAdd}>
          {t('admin:addUniversity', 'Add university')}
        </Button>
      </PageTitle>

      <Card>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Input
            placeholder={t('common:search', 'Search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <CardTitle>{t('admin:universitiesList', 'Universities')}</CardTitle>
        {loading ? (
          <p className="text-[var(--color-text-muted)] py-6">{t('common:loading', 'Loading...')}</p>
        ) : list.length === 0 ? (
          <p className="text-[var(--color-text-muted)] py-8 text-center">
            {t('admin:noUniversitiesInCatalog', 'No universities in catalog.')}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left py-2 font-medium">{t('university:universityName', 'Name')}</th>
                    <th className="text-left py-2 font-medium">{t('university:country', 'Country')}</th>
                    <th className="text-left py-2 font-medium">{t('university:city', 'City')}</th>
                    <th className="text-right py-2 font-medium">{t('common:actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((u) => (
                    <tr key={u.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-3 font-medium">{u.name || u.universityName}</td>
                      <td className="py-3">{u.country ?? '—'}</td>
                      <td className="py-3">{u.city ?? '—'}</td>
                      <td className="py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(u.id)}>
                          {t('common:edit', 'Edit')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  {t('common:prev', 'Prev')}
                </Button>
                <span className="flex items-center px-2 text-[var(--color-text-muted)]">
                  {page} / {totalPages}
                </span>
                <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  {t('common:next', 'Next')}
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      <Modal
        open={modal !== null}
        onClose={() => { setModal(null); setEditingId(null) }}
        title={modal === 'add' ? t('admin:addUniversity', 'Add university') : t('common:edit', 'Edit')}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModal(null); setEditingId(null) }}>
              {t('common:cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !formName.trim()} loading={submitting}>
              {modal === 'add' ? t('common:create', 'Create') : t('common:save', 'Save')}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label={t('university:universityName', 'University name')}
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
          <Input label={t('university:country', 'Country')} value={formCountry} onChange={(e) => setFormCountry(e.target.value)} />
          <Input label={t('university:city', 'City')} value={formCity} onChange={(e) => setFormCity(e.target.value)} />
          <Input label={t('university:slogan', 'Slogan')} value={formTagline} onChange={(e) => setFormTagline(e.target.value)} />
          <Input label={t('university:logoUrl', 'Logo URL')} value={formLogoUrl} onChange={(e) => setFormLogoUrl(e.target.value)} />
          <div className="w-full">
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
              {t('university:description', 'Description')}
            </label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
              className="w-full rounded-input border bg-[var(--color-card)] px-3 py-2 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
            />
          </div>
          <Input
            label={t('university:foundedYear', 'Founded year')}
            type="number"
            value={formEstablishedYear}
            onChange={(e) => setFormEstablishedYear(e.target.value)}
          />
          <Input
            label={t('university:studentCount', 'Student count')}
            type="number"
            value={formStudentCount}
            onChange={(e) => setFormStudentCount(e.target.value)}
          />
          <div className="border-t border-[var(--color-border)] pt-3 mt-3">
            <p className="text-sm font-medium text-[var(--color-text)] mb-2">{t('university:facultiesListTitle', 'Faculties')}</p>
            <p className="text-xs text-[var(--color-text-muted)] mb-2">{t('university:facultiesHint', 'Select faculties. Expand to customize items.')}</p>
            <div className="grid gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto">
              {FIELD_OF_STUDY.map((cat) => {
                const selected = formFacultyCodes.includes(cat.id)
                const open = openFacultyId === cat.id
                const items = formFacultyItems[cat.id] ?? cat.items
                return (
                  <div
                    key={cat.id}
                    className={`rounded-lg border-2 p-2 transition-all ${selected ? 'border-primary-accent' : 'border-[var(--color-border)]'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...formFacultyCodes, cat.id].slice(0, 50)
                              : formFacultyCodes.filter((x) => x !== cat.id)
                            setFormFacultyCodes(next)
                            if (!e.target.checked) {
                              const { [cat.id]: _, ...rest } = formFacultyItems
                              setFormFacultyItems(rest)
                            }
                          }}
                          className="rounded border-[var(--color-border)]"
                        />
                        <span className="text-sm truncate">{t(cat.titleKey)}</span>
                      </label>
                      {selected && (
                        <button
                          type="button"
                          onClick={() => setOpenFacultyId(open ? null : cat.id)}
                          className="p-1 rounded text-[var(--color-text-muted)] hover:bg-[var(--color-border)]"
                          aria-expanded={open}
                        >
                          <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {open && selected && (
                      <div className="mt-2 pt-2 border-t border-[var(--color-border)] space-y-1 max-h-32 overflow-y-auto">
                        {cat.items.map((it) => {
                          const inc = items.includes(it)
                          return (
                            <label key={it} className="flex items-center gap-2 cursor-pointer text-xs">
                              <input
                                type="checkbox"
                                checked={inc}
                                onChange={() => {
                                  const list = formFacultyItems[cat.id] ?? cat.items
                                  const next = inc ? list.filter((x) => x !== it) : [...list, it]
                                  setFormFacultyItems({ ...formFacultyItems, [cat.id]: next })
                                }}
                                className="rounded border-[var(--color-border)]"
                              />
                              <span className={inc ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}>{it}</span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
              {t('university:targetStudentCountries', 'Target student countries')}
            </label>
            <ChipSelect
              options={COUNTRY_OPTIONS.map((c) => c.label)}
              value={formTargetCountries.map((code) => COUNTRY_OPTIONS.find((c) => c.code === code)?.label ?? code)}
              onChange={(labels) => {
                const codes: string[] = labels
                  .map((label) => COUNTRY_OPTIONS.find((c) => c.label === label)?.code)
                  .filter((v): v is NonNullable<typeof v> => v != null)
                setFormTargetCountries(codes)
              }}
            />
          </div>

          <div className="border-t border-[var(--color-border)] pt-3 mt-3">
            <button
              type="button"
              onClick={() => setShowPrograms(!showPrograms)}
              className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]"
            >
              <svg className={`w-4 h-4 transition-transform ${showPrograms ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              {t('university:programs', 'Programs')} ({formPrograms.length})
            </button>
            {showPrograms && (
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {formPrograms.map((p, i) => (
                  <div key={i} className="flex gap-2 items-start p-2 rounded-lg border border-[var(--color-border)]">
                    <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
                      <Input label={t('university:programName', 'Name')} value={p.name} onChange={(e) => setFormPrograms((prev) => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                      <Input label={t('university:degreeLevel', 'Degree')} value={p.degreeLevel} onChange={(e) => setFormPrograms((prev) => prev.map((x, j) => j === i ? { ...x, degreeLevel: e.target.value } : x))} />
                      <Input label={t('university:field', 'Field')} value={p.field} onChange={(e) => setFormPrograms((prev) => prev.map((x, j) => j === i ? { ...x, field: e.target.value } : x))} />
                      <Input label={t('university:durationYears', 'Years')} type="number" value={p.durationYears ?? ''} onChange={(e) => setFormPrograms((prev) => prev.map((x, j) => j === i ? { ...x, durationYears: e.target.value ? Number(e.target.value) : undefined } : x))} />
                      <Input label={t('university:tuitionFee', 'Tuition')} type="number" value={p.tuitionFee ?? ''} onChange={(e) => setFormPrograms((prev) => prev.map((x, j) => j === i ? { ...x, tuitionFee: e.target.value ? Number(e.target.value) : undefined } : x))} />
                      <Input label={t('university:language', 'Language')} value={p.language ?? ''} onChange={(e) => setFormPrograms((prev) => prev.map((x, j) => j === i ? { ...x, language: e.target.value } : x))} />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setFormPrograms((prev) => prev.filter((_, j) => j !== i))} icon={<Trash2 size={14} />} aria-label={t('common:delete')}>
                  {''}
                </Button>
                  </div>
                ))}
                <Button size="sm" variant="secondary" onClick={() => setFormPrograms((prev) => [...prev, { name: '', degreeLevel: '', field: '' }])} icon={<Plus size={14} />}>
                  {t('university:addProgram', 'Add program')}
                </Button>
              </div>
            )}
          </div>

          <div className="border-t border-[var(--color-border)] pt-3 mt-3">
            <button
              type="button"
              onClick={() => setShowScholarships(!showScholarships)}
              className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]"
            >
              <svg className={`w-4 h-4 transition-transform ${showScholarships ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              {t('university:scholarships', 'Scholarships')} ({formScholarships.length})
            </button>
            {showScholarships && (
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {formScholarships.map((s, i) => (
                  <div key={i} className="flex gap-2 items-start p-2 rounded-lg border border-[var(--color-border)]">
                    <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
                      <Input label={t('university:scholarshipName', 'Name')} value={s.name} onChange={(e) => setFormScholarships((prev) => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                      <Input label={t('university:coveragePercent', 'Coverage %')} type="number" value={s.coveragePercent} onChange={(e) => setFormScholarships((prev) => prev.map((x, j) => j === i ? { ...x, coveragePercent: Number(e.target.value) || 0 } : x))} />
                      <Input label={t('university:maxSlots', 'Max slots')} type="number" value={s.maxSlots} onChange={(e) => setFormScholarships((prev) => prev.map((x, j) => j === i ? { ...x, maxSlots: Number(e.target.value) || 0 } : x))} />
                      <Input label={t('university:deadline', 'Deadline')} type="date" value={s.deadline ?? ''} onChange={(e) => setFormScholarships((prev) => prev.map((x, j) => j === i ? { ...x, deadline: e.target.value } : x))} />
                      <Input label={t('university:eligibility', 'Eligibility')} value={s.eligibility ?? ''} onChange={(e) => setFormScholarships((prev) => prev.map((x, j) => j === i ? { ...x, eligibility: e.target.value } : x))} className="col-span-2" />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setFormScholarships((prev) => prev.filter((_, j) => j !== i))} icon={<Trash2 size={14} />} aria-label={t('common:delete')}>
                  {''}
                </Button>
                  </div>
                ))}
                <Button size="sm" variant="secondary" onClick={() => setFormScholarships((prev) => [...prev, { name: '', coveragePercent: 100, maxSlots: 1 }])} icon={<Plus size={14} />}>
                  {t('university:addScholarship', 'Add scholarship')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
