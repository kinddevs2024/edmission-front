import { Badge } from '@/components/ui/Badge'
import type { StudentDocumentStatus } from '@/types/documentModule'

const STATUS_LABELS: Record<StudentDocumentStatus, string> = {
  sent: 'Sent',
  viewed: 'Viewed',
  accepted: 'Accepted',
  declined: 'Declined',
  postponed: 'Postponed',
  expired: 'Expired',
  revoked: 'Revoked',
}

const STATUS_VARIANTS: Record<StudentDocumentStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  sent: 'default',
  viewed: 'info',
  accepted: 'success',
  declined: 'error',
  postponed: 'warning',
  expired: 'warning',
  revoked: 'error',
}

export function DocumentStatusBadge({ status }: { status: StudentDocumentStatus }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
}

