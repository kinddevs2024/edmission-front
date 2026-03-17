import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { DocumentTemplate } from '@/types/documentModule'
import { DOCUMENT_TYPE_LABELS } from '@/utils/documentScene'

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
              <Badge variant="info">{DOCUMENT_TYPE_LABELS[template.type]}</Badge>
              {template.isDefault ? <Badge variant="success">Default</Badge> : null}
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">{template.summary ?? 'No preview text yet.'}</p>
          </div>
          <Badge variant={template.status === 'active' ? 'success' : template.status === 'draft' ? 'warning' : 'default'}>
            {template.status}
          </Badge>
        </div>
      </button>
      {!compact ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {onEdit ? <Button size="sm" variant="secondary" onClick={onEdit}>Edit</Button> : null}
          {onDuplicate ? <Button size="sm" variant="ghost" onClick={onDuplicate}>Duplicate</Button> : null}
          {onArchive ? <Button size="sm" variant="ghost" onClick={onArchive}>Archive</Button> : null}
          {onSetDefault ? <Button size="sm" variant="ghost" onClick={onSetDefault}>Set default</Button> : null}
        </div>
      ) : null}
    </Card>
  )
}

