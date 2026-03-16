import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { PageTitle } from '@/components/ui/PageTitle'
import { Select } from '@/components/ui/Select'
import { getOfferTemplates, createOfferTemplate, updateOfferTemplate, deleteOfferTemplate } from '@/services/university'
import { Edit2, Trash2 } from 'lucide-react'
import { toastApiError } from '@/utils/toastError'

type LayoutKey = 'classic' | 'modern' | 'minimal'

interface OfferTemplate {
  id: string
  name: string
  layoutKey: LayoutKey
  primaryColor?: string
  accentColor?: string
  backgroundImageUrl?: string
  bodyTemplate: string
  titleTemplate?: string
  isDefault?: boolean
}

export function OfferTemplates() {
  const { t } = useTranslation(['common', 'university'])
  const [list, setList] = useState<OfferTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [layoutKey, setLayoutKey] = useState<LayoutKey>('classic')
  const [primaryColor, setPrimaryColor] = useState('#0F766E')
  const [accentColor, setAccentColor] = useState('#EC4899')
  const [bodyTemplate, setBodyTemplate] = useState('Dear {{studentName}},\n\nWe are pleased to offer you admission to {{programName}}.')
  const [titleTemplate, setTitleTemplate] = useState('Offer for {{studentName}}')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getOfferTemplates()
      .then((data) => setList(data ?? []))
      .catch((e) => { toastApiError(e); setList([]) })
      .finally(() => setLoading(false))
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setLayoutKey('classic')
    setPrimaryColor('#0F766E')
    setAccentColor('#EC4899')
    setBodyTemplate('Dear {{studentName}},\n\nWe are pleased to offer you admission to {{programName}}.')
    setTitleTemplate('Offer for {{studentName}}')
  }

  const openCreate = () => {
    resetForm()
    setModalOpen(true)
  }

  const openEdit = (tmpl: OfferTemplate) => {
    setEditingId(tmpl.id)
    setName(tmpl.name)
    setLayoutKey(tmpl.layoutKey)
    setPrimaryColor(tmpl.primaryColor ?? '#0F766E')
    setAccentColor(tmpl.accentColor ?? '#EC4899')
    setBodyTemplate(tmpl.bodyTemplate)
    setTitleTemplate(tmpl.titleTemplate ?? '')
    setModalOpen(true)
  }

  const handleSubmit = () => {
    if (!name.trim() || !bodyTemplate.trim()) return
    setSubmitting(true)
    if (editingId) {
      updateOfferTemplate(editingId, {
        name: name.trim(),
        layoutKey,
        primaryColor,
        accentColor,
        bodyTemplate,
        titleTemplate: titleTemplate.trim() || undefined,
      })
        .then((updated) => {
          setList((prev) =>
            prev.map((t) => (t.id === editingId ? { ...(updated as OfferTemplate) } : t))
          )
          setModalOpen(false)
          resetForm()
        })
        .catch(toastApiError)
        .finally(() => setSubmitting(false))
    } else {
      createOfferTemplate({
        name: name.trim(),
        layoutKey,
        primaryColor,
        accentColor,
        bodyTemplate,
        titleTemplate: titleTemplate.trim() || undefined,
      })
        .then((tmpl) => {
          setList((prev) => [tmpl as OfferTemplate, ...prev])
          setModalOpen(false)
          resetForm()
        })
        .catch(toastApiError)
        .finally(() => setSubmitting(false))
    }
  }

  const handleDelete = (id: string) => {
    if (!window.confirm(t('university:deleteOfferTemplateConfirm', 'Delete this template?'))) return
    deleteOfferTemplate(id)
      .then(() => {
        setList((prev) => prev.filter((t) => t.id !== id))
      })
      .catch(toastApiError)
  }

  const layoutOptions = [
    { value: 'classic', label: 'Classic' },
    { value: 'modern', label: 'Modern' },
    { value: 'minimal', label: 'Minimal' },
  ]

  return (
    <div className="space-y-4">
      <PageTitle title={t('university:offerTemplatesTitle', 'Offer templates')} icon="Award" />

      <Card className="animate-card-enter">
        <div className="flex justify-between items-center mb-4">
          <CardTitle>{t('university:offerTemplatesList', 'Templates')}</CardTitle>
          <Button onClick={openCreate}>
            {t('university:createOfferTemplate', 'Create template')}
          </Button>
        </div>
        {loading ? (
          <p className="text-[var(--color-text-muted)]">{t('common:loading', 'Loading...')}</p>
        ) : list.length === 0 ? (
          <p className="text-[var(--color-text-muted)] py-8">
            {t('university:noOfferTemplates', 'No templates yet. Create one to start.')}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {list.map((tmpl) => (
              <Card key={tmpl.id} className="p-4 border border-[var(--color-border)] bg-[var(--color-card)]">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div>
                    <p className="font-medium text-[var(--color-text)]">{tmpl.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)] capitalize">{tmpl.layoutKey}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {tmpl.isDefault && (
                      <span className="rounded-full border border-[var(--color-primary-accent)] px-2 py-0.5 text-xs text-[var(--color-primary-accent)]">
                        {t('university:defaultTemplate', 'Default')}
                      </span>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(tmpl)}
                      aria-label={t('common:edit', 'Edit')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => handleDelete(tmpl.id)}
                      aria-label={t('common:delete', 'Delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="h-24 rounded-xl border border-dashed border-[var(--color-border)] bg-gradient-to-br from-[var(--color-bg-muted)] to-[var(--color-bg)] p-3 text-xs text-[var(--color-text-muted)] overflow-hidden">
                  <div className="font-semibold text-[var(--color-text)] mb-1 truncate">
                    {tmpl.titleTemplate || tmpl.name}
                  </div>
                  <p className="line-clamp-3 whitespace-pre-wrap">
                    {tmpl.bodyTemplate}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); resetForm() }}
        title={editingId ? t('university:editOfferTemplate', 'Edit offer template') : t('university:createOfferTemplate', 'Create offer template')}
        footer={(
          <>
            <Button variant="secondary" onClick={() => { setModalOpen(false); resetForm() }}>{t('common:cancel')}</Button>
            <Button onClick={handleSubmit} disabled={submitting || !name.trim() || !bodyTemplate.trim()} loading={submitting}>
              {t('common:create')}
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          <Input label={t('common:name')} value={name} onChange={(e) => setName(e.target.value)} />
          <Select
            label={t('university:layout', 'Layout')}
            value={layoutKey}
            onChange={(e) => setLayoutKey(e.target.value as LayoutKey)}
            options={layoutOptions}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('university:primaryColor', 'Primary color')} value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            <Input label={t('university:accentColor', 'Accent color')} value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
          </div>
          <Input
            label={t('university:titleTemplate', 'Title (optional)')}
            value={titleTemplate}
            onChange={(e) => setTitleTemplate(e.target.value)}
          />
          <Textarea
            label={t('university:bodyTemplate', 'Body')}
            rows={6}
            value={bodyTemplate}
            onChange={(e) => setBodyTemplate(e.target.value)}
            hint={t('university:bodyTemplateHint', 'Available placeholders: {{studentName}}, {{universityName}}, {{programName}}, {{date}}')}
          />
        </div>
      </Modal>
    </div>
  )
}

