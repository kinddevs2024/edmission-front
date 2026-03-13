import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FileUpload } from '@/components/ui/FileUpload'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { PageTitle } from '@/components/ui/PageTitle'
import {
  getLandingCertificates,
  createLandingCertificate,
  updateLandingCertificate,
  deleteLandingCertificate,
  type LandingCertificateItem,
} from '@/services/admin'
import { toastApiError } from '@/utils/toastError'
import { Plus, Trash2, Pencil } from 'lucide-react'

export function AdminLandingCertificates() {
  const { t } = useTranslation(['common', 'admin'])
  const [list, setList] = useState<LandingCertificateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<LandingCertificateItem | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<LandingCertificateItem | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [formType, setFormType] = useState<'university' | 'student'>('university')
  const [formTitle, setFormTitle] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')

  const load = () => {
    setLoading(true)
    getLandingCertificates()
      .then(setList)
      .catch((e) => {
        toastApiError(e)
        setList([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const openAdd = () => {
    setFormType('university')
    setFormTitle('')
    setFormImageUrl('')
    setAddOpen(true)
  }

  const openEdit = (item: LandingCertificateItem) => {
    setEditTarget(item)
    setFormType(item.type)
    setFormTitle(item.title)
    setFormImageUrl(item.imageUrl)
  }

  const handleAdd = () => {
    if (!formTitle.trim() || !formImageUrl.trim()) return
    setSubmitting(true)
    createLandingCertificate({
      type: formType,
      title: formTitle.trim(),
      imageUrl: formImageUrl.trim(),
    })
      .then(() => {
        setAddOpen(false)
        load()
      })
      .catch(toastApiError)
      .finally(() => setSubmitting(false))
  }

  const handleEdit = () => {
    if (!editTarget || !formTitle.trim() || !formImageUrl.trim()) return
    setSubmitting(true)
    updateLandingCertificate(editTarget.id, {
      type: formType,
      title: formTitle.trim(),
      imageUrl: formImageUrl.trim(),
    })
      .then(() => {
        setEditTarget(null)
        load()
      })
      .catch(toastApiError)
      .finally(() => setSubmitting(false))
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    setDeleteSubmitting(true)
    deleteLandingCertificate(deleteTarget.id)
      .then(() => {
        setList((prev) => prev.filter((i) => i.id !== deleteTarget.id))
        setDeleteTarget(null)
      })
      .catch(toastApiError)
      .finally(() => setDeleteSubmitting(false))
  }

  const formContent = (
    <div className="space-y-3">
      <Select
        label={t('admin:certificateType', 'Type')}
        value={formType}
        onChange={(e) => setFormType(e.target.value as 'university' | 'student')}
        options={[
          { value: 'university', label: t('admin:certificateTypeUniversity', 'University') },
          { value: 'student', label: t('admin:certificateTypeStudent', 'Student') },
        ]}
      />
      <Input
        label={t('admin:certificateTitle', 'Title')}
        value={formTitle}
        onChange={(e) => setFormTitle(e.target.value)}
        placeholder={t('admin:certificateTitlePlaceholder', 'University or student name')}
        required
      />
      <FileUpload
        label={t('admin:certificateImage', 'Image')}
        value={formImageUrl}
        onChange={setFormImageUrl}
        accept="image/jpeg,image/png,image/gif,image/webp"
      />
    </div>
  )

  return (
    <div className="space-y-4">
      <PageTitle title={t('admin:landingCertificates', 'Landing Certificates')} icon="Award">
        <Button size="sm" onClick={openAdd} icon={<Plus size={16} />}>
          {t('admin:addCertificate', 'Add certificate')}
        </Button>
      </PageTitle>

      <Card>
        <CardTitle>{t('admin:landingCertificatesList', 'Certificates & Testimonials')}</CardTitle>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {t('admin:landingCertificatesHint', 'Manage certificates (universities) and testimonials (students) shown on the landing page.')}
        </p>
        {loading ? (
          <p className="text-[var(--color-text-muted)] py-6">{t('common:loading', 'Loading...')}</p>
        ) : list.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[var(--color-text-muted)] mb-4">{t('admin:noCertificates', 'No certificates yet.')}</p>
            <Button size="sm" onClick={openAdd} icon={<Plus size={14} />}>
              {t('admin:addCertificate', 'Add certificate')}
            </Button>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((item) => (
              <div
                key={item.id}
                className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-4 flex flex-col"
              >
                <div className="aspect-[4/3] rounded-lg bg-[var(--color-border)]/30 overflow-hidden mb-3">
                  <img
                    src={item.imageUrl}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="12">No image</text></svg>'
                    }}
                  />
                </div>
                <p className="font-medium text-[var(--color-text)] truncate">{item.title}</p>
                <p className="text-xs text-[var(--color-text-muted)] capitalize">{item.type}</p>
                <div className="flex gap-2 mt-2">
                  <Button variant="secondary" size="sm" onClick={() => openEdit(item)} icon={<Pencil size={14} />}>
                    {t('common:edit')}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteTarget(item)}
                    icon={<Trash2 size={14} />}
                  >
                    {t('common:delete')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t('admin:addCertificate', 'Add certificate')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              {t('common:cancel')}
            </Button>
            <Button onClick={handleAdd} disabled={submitting || !formTitle.trim() || !formImageUrl.trim()} loading={submitting}>
              {t('common:create', 'Create')}
            </Button>
          </>
        }
      >
        {formContent}
      </Modal>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={t('admin:editCertificate', 'Edit certificate')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditTarget(null)}>
              {t('common:cancel')}
            </Button>
            <Button onClick={handleEdit} disabled={submitting || !formTitle.trim() || !formImageUrl.trim()} loading={submitting}>
              {t('common:save')}
            </Button>
          </>
        }
      >
        {formContent}
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('admin:deleteCertificate', 'Delete certificate')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleteSubmitting}>
              {t('common:cancel')}
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} loading={deleteSubmitting}>
              {t('common:delete')}
            </Button>
          </>
        }
      >
        {deleteTarget && (
          <p className="text-[var(--color-text)]">
            {t('admin:deleteCertificateConfirm', 'Delete this certificate?')} <strong>{deleteTarget.title}</strong>
          </p>
        )}
      </Modal>
    </div>
  )
}
