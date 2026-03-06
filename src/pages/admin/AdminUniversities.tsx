import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PageTitle } from '@/components/ui/PageTitle'
import {
  getAdminCatalogUniversities,
  createCatalogUniversity,
  getCatalogUniversity,
  updateCatalogUniversity,
  type AdminCatalogUniversity,
} from '@/services/admin'

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
          <Input
            label={t('university:description', 'Description')}
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            multiline
          />
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
        </div>
      </Modal>
    </div>
  )
}
