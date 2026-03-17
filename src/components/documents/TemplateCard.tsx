import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { DocumentTemplate } from '@/types/documentModule'

interface TemplateCardProps {
  template: DocumentTemplate
  selected?: boolean
  compact?: boolean
  onEdit?: () => void
  onDuplicate?: () => void
  onArchive?: () => void
  onSetDefault?: () => void
  onSelect?: () => void
}

export function TemplateCard({
  template,
  selected = false,
  compact = false,
  onEdit,
  onDuplicate,
  onArchive,
  onSetDefault,
  onSelect,
}: TemplateCardProps) {
  const { t } = useTranslation('documents')
  const typeLabel = template.type === 'offer'
    ? t('type.offer', 'Offer')
    : t('type.scholarship', 'Scholarship')

  return (
    <Card
      className={`border transition-all ${selected ? 'border-primary-accent shadow-[0_0_0_1px_var(--color-primary-accent)]' : 'border-[var(--color-border)]'}`}
      interactive
    >
      <button type="button" className="w-full text-left" onClick={onSelect}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-[var(--color-text)]">{template.name}</h3>
              <Badge variant="info">{typeLabel}</Badge>
              {template.isDefault ? <Badge variant="success">{t('templateCard.default', 'Default')}</Badge> : null}
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">{template.summary ?? t('templateCard.noPreview', 'No preview text yet.')}</p>
          </div>
          <Badge variant={template.status === 'active' ? 'success' : template.status === 'draft' ? 'warning' : 'default'}>
            {t(`templateStatus.${template.status}`, template.status)}
          </Badge>
        </div>
      </button>
      {!compact ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {onEdit ? <Button size="sm" variant="secondary" onClick={onEdit}>{t('templateCard.edit', 'Edit')}</Button> : null}
          {onDuplicate ? <Button size="sm" variant="ghost" onClick={onDuplicate}>{t('templateCard.duplicate', 'Duplicate')}</Button> : null}
          {onArchive ? <Button size="sm" variant="ghost" onClick={onArchive}>{t('templateCard.archive', 'Archive')}</Button> : null}
          {onSetDefault ? <Button size="sm" variant="ghost" onClick={onSetDefault}>{t('templateCard.setDefault', 'Set default')}</Button> : null}
        </div>
      ) : null}
    </Card>
  )
}
