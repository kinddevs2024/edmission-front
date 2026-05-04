import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PageTitle } from '@/components/ui/PageTitle'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  getAdminGlobalFaculties,
  createAdminGlobalFaculty,
  updateAdminGlobalFaculty,
  deleteAdminGlobalFaculty,
} from '@/services/admin'
import type { GlobalFaculty } from '@/types/university'
import { toastApiError } from '@/utils/toastError'
import { Pencil, Plus, Trash2 } from 'lucide-react'

export function AdminFaculties() {
  const { t } = useTranslation(['admin', 'common'])
  const [list, setList] = useState<GlobalFaculty[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; faculty?: GlobalFaculty } | null>(null)
  const [name, setName] = useState('')
  const [items, setItems] = useState<string[]>([''])

  const load = () => {
    setLoading(true)
    getAdminGlobalFaculties()
      .then((data) => setList(data))
      .catch((e) => {
        toastApiError(e)
        setList([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setName('')
    setItems([''])
    setModal({ mode: 'create' })
  }

  const openEdit = (faculty: GlobalFaculty) => {
    setName(faculty.name)
    setItems((faculty.items ?? []).length > 0 ? faculty.items : [''])
    setModal({ mode: 'edit', faculty })
  }

  const handleItemChange = (index: number, value: string) => {
    setItems((prev) => prev.map((item, currentIndex) => (currentIndex === index ? value : item)))
  }

  const handleAddItem = () => {
    setItems((prev) => [...prev, ''])
  }

  const handleRemoveItem = (index: number) => {
    setItems((prev) => {
      if (prev.length === 1) return ['']
      return prev.filter((_, currentIndex) => currentIndex !== index)
    })
  }

  const handleSubmit = () => {
    if (!modal || !name.trim()) return
    setSubmitting(true)
    const payload = {
      name: name.trim(),
      items: items.map((item) => item.trim()).filter(Boolean),
    }
    const request =
      modal.mode === 'create'
        ? createAdminGlobalFaculty(payload)
        : updateAdminGlobalFaculty(modal.faculty!.id, payload)

    request
      .then(() => {
        setModal(null)
        load()
      })
      .catch(toastApiError)
      .finally(() => setSubmitting(false))
  }

  const handleDelete = (faculty: GlobalFaculty) => {
    if (!confirm(t('deleteFacultyConfirm', 'Delete this faculty?'))) return
    deleteAdminGlobalFaculty(faculty.id)
      .then(() => setList((prev) => prev.filter((item) => item.id !== faculty.id)))
      .catch(toastApiError)
  }

  return (
    <div className="space-y-4">
      <PageTitle title={t('faculties', 'Faculties')} icon="GraduationCap">
        <Button onClick={openCreate} icon={<Plus size={16} />}>
          {t('addFaculty', 'Add faculty')}
        </Button>
      </PageTitle>

      <Card>
        <CardTitle>{t('facultiesList', 'Global faculties')}</CardTitle>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {t('facultiesHint', 'Create faculties here and they will become available for all universities.')}
        </p>

        {loading ? (
          <p className="py-6 text-[var(--color-text-muted)]">{t('common:loading', 'Loading...')}</p>
        ) : list.length === 0 ? (
          <EmptyState title={t('noFacultiesYet', 'No faculties yet. Add the first one.')} />
        ) : (
          <ul className="mt-4 divide-y divide-[var(--color-border)]">
            {list.map((faculty) => (
              <li key={faculty.id} className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="font-medium">{faculty.name}</p>
                  {(faculty.items ?? []).length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {faculty.items.map((item) => (
                        <span
                          key={item}
                          className="rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1 text-xs text-[var(--color-text-muted)]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      {t('noFacultyItems', 'No programs added yet.')}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(faculty)} icon={<Pencil size={16} />}>
                    {t('common:edit', 'Edit')}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(faculty)} icon={<Trash2 size={16} />}>
                    {t('common:delete', 'Delete')}
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
        title={modal?.mode === 'edit' ? t('editFaculty', 'Edit faculty') : t('addFaculty', 'Add faculty')}
        footer={
          modal ? (
            <>
              <Button variant="secondary" onClick={() => setModal(null)}>
                {t('common:cancel', 'Cancel')}
              </Button>
              <Button onClick={handleSubmit} disabled={submitting || !name.trim()} loading={submitting}>
                {modal.mode === 'create' ? t('common:create', 'Create') : t('common:save', 'Save')}
              </Button>
            </>
          ) : undefined
        }
      >
        <div className="space-y-3">
          <Input
            label={t('facultyName', 'Faculty name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('facultyNamePlaceholder', 'e.g. Faculty of Engineering')}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">
                  {t('facultyItemsLabel', 'Programs / directions')}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {t('facultyItemsHint', 'Each program is added separately and can be edited or removed.')}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={handleAddItem} icon={<Plus size={14} />}>
                {t('addProgram', 'Add program')}
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={`${modal?.faculty?.id ?? 'new'}-${index}`} className="flex items-start gap-2">
                  <Input
                    value={item}
                    onChange={(e) => handleItemChange(index, e.target.value)}
                    placeholder={t('facultyItemsPlaceholder', 'Program name')}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveItem(index)}
                    icon={<Trash2 size={14} />}
                    aria-label={t('common:delete', 'Delete')}
                  >
                    {t('common:delete', 'Delete')}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
