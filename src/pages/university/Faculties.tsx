import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PageTitle } from '@/components/ui/PageTitle'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { getFaculties, createFaculty, updateFaculty, deleteFaculty } from '@/services/university'
import type { Faculty } from '@/types/university'
import { Pencil, Trash2, Plus } from 'lucide-react'

export function Faculties() {
  const { t } = useTranslation(['common', 'university'])
  const [list, setList] = useState<Faculty[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; faculty?: Faculty } | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    getFaculties()
      .then((data) => setList((data ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

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
        <CardTitle>{t('university:facultiesListTitle')}</CardTitle>
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

