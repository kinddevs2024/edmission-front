import { useTranslation } from 'react-i18next'
import { formatDate } from '@/utils/format'

type DocumentSummaryPanelProps = {
  payload?: Record<string, unknown> | null
  fallbackDeadline?: string
  heading?: string
}

type SummaryItem = {
  label: string
  value: string
}

export function DocumentSummaryPanel({
  payload,
  fallbackDeadline,
  heading,
}: DocumentSummaryPanelProps) {
  const { t } = useTranslation('documents')
  const data = readRecord(payload)
  const offer = readRecord(data.offer)
  const scholarship = readRecord(data.scholarship)
  const deadline = readRecord(data.deadline)
  const document = readRecord(data.document)

  const issuedOn = readString(document.issuedOnLabel) || formatDateValue(readString(document.issuedOn))
  const acceptBy =
    readString(deadline.acceptByLabel) ||
    formatDateValue(readString(deadline.acceptBy)) ||
    formatDateValue(fallbackDeadline)
  const summary = readString(document.summary)
  const smallPrint =
    readString(document.smallPrint) ||
    t('summary.finePrint', 'This summary clarifies the key dates, fees, conditions, and scholarship details attached to the document.')
  const universityMessage = readString(document.message)
  const documentType = readString(document.type)
  const resolvedHeading = heading ?? t('summary.heading', 'Document summary')

  const items: SummaryItem[] = [
    { label: t('summary.labels.issued', 'Issued'), value: issuedOn },
    { label: t('summary.labels.acceptBy', 'Accept by'), value: acceptBy || t('summary.openEnded', 'Open ended') },
    { label: t('summary.labels.program', 'Program'), value: readString(offer.programName) },
    { label: t('summary.labels.degree', 'Degree'), value: readString(offer.degreeLevel) },
    { label: t('summary.labels.intake', 'Intake'), value: readString(offer.intake) },
    { label: t('summary.labels.startDate', 'Start date'), value: readString(offer.startDateLabel) || formatDateValue(readString(offer.startDate)) },
    { label: t('summary.labels.tuition', 'Tuition'), value: readString(offer.tuitionDisplay) || formatTuitionValue(offer) },
    { label: t('summary.labels.scholarship', 'Scholarship'), value: readString(scholarship.summary) || formatScholarshipValue(scholarship) },
    { label: t('summary.labels.conditions', 'Conditions'), value: readString(offer.conditions) },
    { label: t('summary.labels.referenceId', 'Reference ID'), value: readString(document.id) },
  ].filter((item) => item.value)

  if (!summary && items.length === 0 && !universityMessage && !smallPrint) {
    return null
  }

  const typeLabel = documentType === 'offer'
    ? t('type.offerDocument', 'Offer document')
    : documentType === 'scholarship'
      ? t('type.scholarshipDocument', 'Scholarship document')
      : t('common.document', 'Document')

  return (
    <div className="rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(15,23,42,0.03)_0%,rgba(14,165,233,0.08)_100%)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">{resolvedHeading}</p>
          {summary ? (
            <p className="max-w-3xl text-sm leading-6 text-[var(--color-text)]">{summary}</p>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              {t('summary.fallbackDescription', 'Review the key terms below before sending or accepting this document.')}
            </p>
          )}
        </div>
        <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1 text-xs font-medium text-[var(--color-text-muted)]">
          {typeLabel}
        </span>
      </div>

      {items.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <div key={item.label} className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-card)]/80 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{item.label}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text)] whitespace-pre-wrap break-words">{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {universityMessage ? (
        <div className="mt-4 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-card)]/85 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{t('summary.universityMessage', 'University message')}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">{universityMessage}</p>
        </div>
      ) : null}

      <p className="mt-4 text-xs leading-5 text-[var(--color-text-muted)]">{smallPrint}</p>
    </div>
  )
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function formatDateValue(value?: string) {
  if (!value) return ''
  const trimmed = value.trim()
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? new Date(`${trimmed}T12:00:00`)
    : new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return value
  return formatDate(parsed)
}

function formatTuitionValue(offer: Record<string, unknown>) {
  const fee = readString(offer.tuitionFee)
  const currency = readString(offer.currency)
  return [fee, currency].filter(Boolean).join(' ')
}

function formatScholarshipValue(scholarship: Record<string, unknown>) {
  const amount = readString(scholarship.amount)
  const percent = readString(scholarship.percent)
  const type = readString(scholarship.type)
  const percentLabel = percent ? `${percent}%` : ''
  return [amount, percentLabel, type].filter(Boolean).join(' ')
}
