import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PageTitle } from '@/components/ui/PageTitle'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { getFaculties, getProfile, createFaculty, updateFaculty, deleteFaculty } from '@/services/university'
import type { Faculty } from '@/types/university'
import { FIELD_OF_STUDY } from '@/constants/fieldOfStudy'
import { Pencil, Trash2, Plus } from 'lucide-react'

export function Faculties() {
  const { t } = useTranslation(['common', 'university'])
  const [profileFacultyCodes, setProfileFacultyCodes] = useState<string[]>([])
  const [list, setList] = useState<Faculty[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; faculty?: Faculty } | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([getProfile(), getFaculties()])
      .then(([profile, faculties]) => {
        setProfileFacultyCodes(profile.facultyCodes ?? [])
        setList((faculties ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))
      })
      .catch(() => {
        setProfileFacultyCodes([])
        setList([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const profileFacultyNames = profileFacultyCodes
    .map((id) => FIELD_OF_STUDY.find((c) => c.id === id))
    .filter(Boolean)
    .map((cat) => t(cat!.titleKey))

  const openCreate = () => {
    setName('')
    setDescription('')
    setModal({ mode: 'create' })
  }

  const openEdit = (f: Faculty) => {
    setName(f.name ?? '')
    setDescription(f.description ?? '')
    setModal({ mode: 'edit', faculty: f })
  }

  const handleSubmit = () => {
    if (!modal) return
    setSubmitting(true)
    const req =
      modal.mode === 'create'
        ? createFaculty({ name: name.trim(), description: description.trim() })
        : updateFaculty(modal.faculty!.id, { name: name.trim(), description: description.trim() })
    req
      .then(() => {
        setModal(null)
        load()
      })
      .catch(() => {})
      .finally(() => setSubmitting(false))
  }

  const handleDelete = (f: Faculty) => {
    if (!confirm(t('common:confirmDelete', 'Delete?'))) return
    deleteFaculty(f.id)
      .then(() => setList((prev) => prev.filter((x) => x.id !== f.id)))
      .catch(() => {})
  }

  return (
    <div className="space-y-4">
      <PageTitle title={t('university:facultiesListTitle')} icon="Building2">
        <Button onClick={openCreate} icon={<Plus size={16} />}>
          {t('university:addFaculty')}
        </Button>
      </PageTitle>

      <Card>
        <CardTitle>{t('university:facultiesFromProfile', 'Faculties from profile')}</CardTitle>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {t('university:facultiesFromProfileHint', 'Directions you selected in your university profile. You can change them in Profile.')}
        </p>
        {loading ? (
          <p className="text-[var(--color-text-muted)] py-4">Loading...</p>
        ) : profileFacultyNames.length === 0 ? (
          <p className="text-[var(--color-text-muted)] py-4">{t('university:noFacultiesInProfile', 'None selected. Add them in your')} <Link to="/university/profile" className="text-primary-accent hover:underline">Profile</Link>.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {profileFacultyNames.map((label) => (
              <li key={label}>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary-accent/15 text-primary-accent text-sm font-medium">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-[var(--color-text-muted)] mt-3">
          <Link to="/university/profile" className="text-primary-accent hover:underline">{t('university:editInProfile', 'Edit in Profile')}</Link>
        </p>
      </Card>

      <Card>
        <CardTitle>{t('university:additionalFaculties', 'Additional faculties')}</CardTitle>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {t('university:additionalFacultiesHint', 'Add your own faculty names and descriptions.')}
        </p>
        {loading ? (
          <p className="text-[var(--color-text-muted)] py-6">Loading...</p>
        ) : list.length === 0 ? (
          <EmptyState title={t('university:noFacultiesYet')} />
        ) : (
          <ul className="mt-3 divide-y divide-[var(--color-border)]">
            {list.map((f) => (
              <li key={f.id} className="py-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{f.name}</p>
                  {f.description && <p className="text-sm text-[var(--color-text-muted)] mt-1 line-clamp-2">{f.description}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => openEdit(f)} icon={<Pencil size={16} />}>
                    {t('university:editFaculty')}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(f)} icon={<Trash2 size={16} />}>
                    {t('common:delete')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {!loading && (
          <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
            <Button size="sm" onClick={openCreate} icon={<Plus size={16} />}>
              {t('university:addFaculty')}
            </Button>
          </div>
        )}
      </Card>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? t('university:editFaculty') : t('university:addFaculty')}
        footer={
          modal ? (
            <>
              <Button variant="secondary" onClick={() => setModal(null)}>{t('common:cancel')}</Button>
              <Button onClick={handleSubmit} disabled={submitting || !name.trim()} loading={submitting}>
                {t('common:save', 'Save')}
              </Button>
            </>
          ) : undefined
        }
      >
        <div className="space-y-3">
          <Input
            label={t('university:facultyName')}
            placeholder={t('university:facultyNamePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label={t('university:facultyDescription')}
            placeholder={t('university:facultyDescriptionPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}

