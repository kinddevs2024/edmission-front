import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PageTitle } from '@/components/ui/PageTitle'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { getFaculties, createFaculty, updateFaculty, deleteFaculty } from '@/services/university'
import type { Faculty } from '@/types/university'

const DESCRIPTION_PREVIEW_LEN = 120

export function Faculties() {
  const { t } = useTranslation(['common', 'university'])
  const [list, setList] = useState<Faculty[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    getFaculties()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setName('')
    setDescription('')
    setModalOpen(true)
  }

  const openEdit = (f: Faculty) => {
    setEditingId(f.id)
    setName(f.name)
    setDescription(f.description)
    setModalOpen(true)
  }

  const handleSave = () => {
    const trimmedName = name.trim()
    const trimmedDesc = description.trim()
    if (!trimmedName || !trimmedDesc) return
    setSubmitting(true)
    if (editingId) {
      updateFaculty(editingId, { name: trimmedName, description: trimmedDesc })
        .then((updated) => {
          setList((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
          setModalOpen(false)
        })
        .finally(() => setSubmitting(false))
    } else {
      createFaculty({ name: trimmedName, description: trimmedDesc })
        .then((newOne) => {
          setList((prev) => [newOne, ...prev])
          setModalOpen(false)
        })
        .finally(() => setSubmitting(false))
    }
  }

  const handleDelete = (id: string) => {
    setSubmitting(true)
    deleteFaculty(id)
      .then(() => {
        setList((prev) => prev.filter((x) => x.id !== id))
        setDeleteConfirmId(null)
      })
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="space-y-4">
      <PageTitle title={t('university:navFaculties')} icon="Building2" />

      <Card className="animate-card-enter">
        <div className="flex justify-between items-center mb-4">
          <CardTitle>{t('university:facultiesListTitle')}</CardTitle>
          <Button onClick={openCreate} icon={<Plus size={16} />}>
            {t('university:addFaculty')}
          </Button>
        </div>
        {loading ? (
          <p className="text-[var(--color-text-muted)]">{t('common:loading')}</p>
        ) : list.length === 0 ? (
          <p className="text-[var(--color-text-muted)] py-8">{t('university:noFacultiesYet')}</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {list.map((f) => (
              <li key={f.id} className="py-4 first:pt-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-[var(--color-text)]">{f.name}</h3>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1 line-clamp-2">
                    {f.description.length > DESCRIPTION_PREVIEW_LEN
                      ? `${f.description.slice(0, DESCRIPTION_PREVIEW_LEN)}…`
                      : f.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(f)} icon={<Pencil size={14} />} aria-label={t('common:actions')}>{t('common:actions')}</Button>
                  {deleteConfirmId === f.id ? (
                    <>
                      <Button variant="secondary" size="sm" onClick={() => handleDelete(f.id)} disabled={submitting}>
                        {t('common:yes')}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>{t('common:no')}</Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(f.id)} icon={<Trash2 size={14} />} className="text-red-600 hover:text-red-700" aria-label={t('common:delete')}>{t('common:delete')}</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? t('university:editFaculty') : t('university:addFaculty')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>{t('common:cancel')}</Button>
            <Button onClick={handleSave} disabled={submitting || !name.trim() || !description.trim()} loading={submitting}>
              {t('common:save')}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label={t('university:facultyName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('university:facultyNamePlaceholder')}
          />
          <label className="block">
            <span className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('university:facultyDescription')}</span>
            <textarea
              className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] min-h-[140px] focus:outline-none focus:ring-2 focus:ring-primary-accent"
              placeholder={t('university:facultyDescriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </div>
      </Modal>
    </div>
  )
}
