import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PageTitle } from '@/components/ui/PageTitle'
import { getInvestors, createInvestor, deleteInvestor, type InvestorItem } from '@/services/admin'
import { Plus, Trash2, Building2 } from 'lucide-react'

export function AdminInvestors() {
  const { t } = useTranslation(['common', 'admin'])
  const [list, setList] = useState<InvestorItem[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<InvestorItem | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [formName, setFormName] = useState('')
  const [formLogoUrl, setFormLogoUrl] = useState('')
  const [formWebsiteUrl, setFormWebsiteUrl] = useState('')
  const [formDescription, setFormDescription] = useState('')

  const load = () => {
    setLoading(true)
    getInvestors()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const openAdd = () => {
    setFormName('')
    setFormLogoUrl('')
    setFormWebsiteUrl('')
    setFormDescription('')
    setAddOpen(true)
  }

  const handleAdd = () => {
    if (!formName.trim()) return
    setSubmitting(true)
    createInvestor({
      name: formName.trim(),
      logoUrl: formLogoUrl.trim() || undefined,
      websiteUrl: formWebsiteUrl.trim() || undefined,
      description: formDescription.trim() || undefined,
    })
      .then(() => {
        setAddOpen(false)
        load()
      })
      .catch(() => {})
      .finally(() => setSubmitting(false))
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    setDeleteSubmitting(true)
    deleteInvestor(deleteTarget.id)
      .then(() => {
        setList((prev) => prev.filter((i) => i.id !== deleteTarget.id))
        setDeleteTarget(null)
      })
      .catch(() => {})
      .finally(() => setDeleteSubmitting(false))
  }

  return (
    <div className="space-y-4">
      <PageTitle title={t('admin:investors', 'Investors')} icon="Building2">
        <Button size="sm" onClick={openAdd} icon={<Plus size={16} />}>
          {t('admin:addInvestor', 'Add investor')}
        </Button>
      </PageTitle>

      <Card>
        <CardTitle>{t('admin:investorsList', 'Investors list')}</CardTitle>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {t('admin:investorsHint', 'Manage investors and partners. Add new or remove existing.')}
        </p>
        {loading ? (
          <p className="text-[var(--color-text-muted)] py-6">{t('common:loading', 'Loading...')}</p>
        ) : list.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[var(--color-text-muted)] mb-4">{t('admin:noInvestors', 'No investors yet.')}</p>
            <Button size="sm" onClick={openAdd} icon={<Plus size={14} />}>
              {t('admin:addInvestor', 'Add investor')}
            </Button>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--color-border)]">
            {list.map((item) => (
              <li key={item.id} className="py-4 flex items-center justify-between gap-4 first:pt-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-border)] flex items-center justify-center shrink-0 overflow-hidden">
                    {item.logoUrl ? (
                      <img src={item.logoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-6 h-6 text-[var(--color-text-muted)]" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    {item.websiteUrl && (
                      <a
                        href={item.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-accent hover:underline truncate block"
                      >
                        {item.websiteUrl}
                      </a>
                    )}
                    {item.description && (
                      <p className="text-sm text-[var(--color-text-muted)] line-clamp-2 mt-0.5">{item.description}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeleteTarget(item)}
                  icon={<Trash2 size={16} />}
                >
                  {t('common:delete')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t('admin:addInvestor', 'Add investor')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              {t('common:cancel')}
            </Button>
            <Button onClick={handleAdd} disabled={submitting || !formName.trim()} loading={submitting}>
              {t('common:create', 'Create')}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label={t('admin:investorName', 'Name')}
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder={t('admin:investorNamePlaceholder', 'Company or person name')}
            required
          />
          <Input
            label={t('admin:investorLogoUrl', 'Logo URL')}
            value={formLogoUrl}
            onChange={(e) => setFormLogoUrl(e.target.value)}
            placeholder="https://..."
          />
          <Input
            label={t('admin:investorWebsiteUrl', 'Website URL')}
            value={formWebsiteUrl}
            onChange={(e) => setFormWebsiteUrl(e.target.value)}
            placeholder="https://..."
          />
          <label className="block">
            <span className="block text-sm font-medium text-[var(--color-text)] mb-1">
              {t('admin:investorDescription', 'Description')}
            </span>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
              className="w-full rounded-input border bg-[var(--color-card)] px-3 py-2 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-accent"
              placeholder={t('admin:investorDescriptionPlaceholder', 'Optional description')}
            />
          </label>
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('admin:deleteInvestor', 'Delete investor')}
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
            {t('admin:deleteInvestorConfirm', 'Delete this investor?')} <strong>{deleteTarget.name}</strong>
          </p>
        )}
      </Modal>
    </div>
  )
}
