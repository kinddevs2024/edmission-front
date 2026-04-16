import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card } from '@/components/ui/Card'
import { TemplateCard } from './TemplateCard'
import { DocumentCanvasStage } from './DocumentCanvasStage'
import { DocumentSummaryPanel } from './DocumentSummaryPanel'
import { adminUniversityGetDocumentTemplates, adminUniversityRenderDocumentTemplatePreview, adminUniversitySendIssuedDocument } from '@/services/admin'
import { getDocumentTemplates, renderDocumentTemplatePreview, sendIssuedDocument } from '@/services/documents'
import { parseScene } from '@/utils/documentScene'
import { toastApiError } from '@/utils/toastError'
import type { DocumentTemplate, DocumentType, RenderedTemplatePreview, UniversityDocumentSummary } from '@/types/documentModule'

type SendDocumentFormState = {
  acceptDeadline: string
  universityMessage: string
  offerProgramName: string
  offerDegreeLevel: string
  offerIntake: string
  offerStartDate: string
  offerTuitionFee: string
  offerCurrency: string
  offerConditions: string
  scholarshipAmount: string
  scholarshipPercent: string
  scholarshipKind: string
}

const initialFormState: SendDocumentFormState = {
  acceptDeadline: '',
  universityMessage: '',
  offerProgramName: '',
  offerDegreeLevel: '',
  offerIntake: '',
  offerStartDate: '',
  offerTuitionFee: '',
  offerCurrency: 'USD',
  offerConditions: '',
  scholarshipAmount: '',
  scholarshipPercent: '',
  scholarshipKind: '',
}

export function SendDocumentModal({
  open,
  studentId,
  chatId,
  studentName,
  actingUniversityUserId,
  onClose,
  onSent,
}: {
  open: boolean
  studentId: string
  chatId?: string
  studentName?: string
  /** When set, list/preview/send use admin proxy for this university account. */
  actingUniversityUserId?: string
  onClose: () => void
  onSent?: (document: UniversityDocumentSummary) => void
}) {
  const { t } = useTranslation(['documents', 'common'])
  const [type, setType] = useState<DocumentType>('offer')
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [form, setForm] = useState<SendDocumentFormState>(initialFormState)
  const [previewData, setPreviewData] = useState<RenderedTemplatePreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoadingTemplates(true)
    const req = actingUniversityUserId
      ? adminUniversityGetDocumentTemplates(actingUniversityUserId, { type })
      : getDocumentTemplates({ type })
    req
      .then((data) => {
        setTemplates(data)
        setSelectedTemplateId((current) => current && data.some((item) => item.id === current) ? current : (data[0]?.id ?? null))
      })
      .catch((error) => {
        toastApiError(error)
        setTemplates([])
      })
      .finally(() => setLoadingTemplates(false))
  }, [open, type, actingUniversityUserId])

  useEffect(() => {
    if (!open) return
    setPreviewData(null)
  }, [open, selectedTemplateId, form, type])

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId]
  )

  const previewScene = previewData
    ? parseScene(previewData.resolvedCanvasJson, selectedTemplate?.pageFormat ?? 'A4_PORTRAIT', selectedTemplate?.width, selectedTemplate?.height)
    : null

  const handlePreview = () => {
    if (!selectedTemplateId) return
    setPreviewLoading(true)
    const previewReq = actingUniversityUserId
      ? adminUniversityRenderDocumentTemplatePreview(actingUniversityUserId, selectedTemplateId, {
          studentId,
          acceptDeadline: form.acceptDeadline || undefined,
          universityMessage: form.universityMessage || undefined,
          documentData: buildDocumentData(form),
        })
      : renderDocumentTemplatePreview(selectedTemplateId, {
          studentId,
          acceptDeadline: form.acceptDeadline || undefined,
          universityMessage: form.universityMessage || undefined,
          documentData: buildDocumentData(form),
        })
    previewReq
      .then((data) => setPreviewData(data))
      .catch(toastApiError)
      .finally(() => setPreviewLoading(false))
  }

  const handleSend = () => {
    if (!selectedTemplateId) return
    setSending(true)
    const sendReq = actingUniversityUserId
      ? adminUniversitySendIssuedDocument(actingUniversityUserId, {
          studentId,
          chatId,
          templateId: selectedTemplateId,
          type,
          acceptDeadline: form.acceptDeadline || undefined,
          universityMessage: form.universityMessage || undefined,
          title: selectedTemplate?.name,
          documentData: buildDocumentData(form),
        })
      : sendIssuedDocument({
          studentId,
          chatId,
          templateId: selectedTemplateId,
          type,
          acceptDeadline: form.acceptDeadline || undefined,
          universityMessage: form.universityMessage || undefined,
          title: selectedTemplate?.name,
          documentData: buildDocumentData(form),
        })
    sendReq
      .then((document) => {
        onSent?.(document)
        onClose()
      })
      .catch(toastApiError)
      .finally(() => setSending(false))
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={studentName
        ? t('documents:sendModal.titleWithName', { name: studentName, defaultValue: 'Send document to {{name}}' })
        : t('documents:sendModal.title', 'Send document')}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>{t('common:cancel', 'Cancel')}</Button>
          <Button variant="secondary" onClick={handlePreview} disabled={!selectedTemplateId || previewLoading} loading={previewLoading}>
            {t('documents:sendModal.previewFinalDocument', 'Preview final document')}
          </Button>
          <Button onClick={handleSend} disabled={!selectedTemplateId || sending} loading={sending}>
            {t('common:send', 'Send')}
          </Button>
        </>
      )}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2">
          <Button variant={type === 'offer' ? 'primary' : 'secondary'} onClick={() => setType('offer')}>{t('documents:type.offer', 'Offer')}</Button>
          <Button variant={type === 'scholarship' ? 'primary' : 'secondary'} onClick={() => setType('scholarship')}>{t('documents:type.scholarship', 'Scholarship')}</Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t('documents:sendModal.templates', 'Templates')}</h3>
            {loadingTemplates ? <span className="text-xs text-[var(--color-text-muted)]">{t('common:loading', 'Loading...')}</span> : null}
          </div>
          <div className="space-y-3">
            {templates.length === 0 ? (
              <Card className="border border-dashed border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
                {t('documents:sendModal.noTemplatesFound', 'No templates found for this document type.')}
              </Card>
            ) : (
              templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  compact
                  selected={template.id === selectedTemplateId}
                  onSelect={() => setSelectedTemplateId(template.id)}
                />
              ))
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label={t('documents:sendModal.acceptDeadline', 'Accept deadline')}
            type="date"
            value={form.acceptDeadline}
            onChange={(event) => setForm((state) => ({ ...state, acceptDeadline: event.target.value }))}
          />
          <Input
            label={t('documents:sendModal.program', 'Program')}
            value={form.offerProgramName}
            onChange={(event) => setForm((state) => ({ ...state, offerProgramName: event.target.value }))}
          />
          <Input
            label={t('documents:sendModal.degreeLevel', 'Degree level')}
            value={form.offerDegreeLevel}
            onChange={(event) => setForm((state) => ({ ...state, offerDegreeLevel: event.target.value }))}
          />
          <Input
            label={t('documents:sendModal.intake', 'Intake')}
            value={form.offerIntake}
            onChange={(event) => setForm((state) => ({ ...state, offerIntake: event.target.value }))}
          />
          <Input
            label={t('documents:sendModal.startDate', 'Start date')}
            type="date"
            value={form.offerStartDate}
            onChange={(event) => setForm((state) => ({ ...state, offerStartDate: event.target.value }))}
          />
          <Input
            label={t('documents:sendModal.tuitionFee', 'Tuition fee')}
            value={form.offerTuitionFee}
            onChange={(event) => setForm((state) => ({ ...state, offerTuitionFee: event.target.value }))}
          />
          <Input
            label={t('documents:sendModal.currency', 'Currency')}
            value={form.offerCurrency}
            onChange={(event) => setForm((state) => ({ ...state, offerCurrency: event.target.value }))}
          />
          {type === 'scholarship' ? (
            <>
              <Input
                label={t('documents:sendModal.scholarshipAmount', 'Scholarship amount')}
                value={form.scholarshipAmount}
                onChange={(event) => setForm((state) => ({ ...state, scholarshipAmount: event.target.value }))}
              />
              <Input
                label={t('documents:sendModal.scholarshipPercent', 'Scholarship percent')}
                value={form.scholarshipPercent}
                onChange={(event) => setForm((state) => ({ ...state, scholarshipPercent: event.target.value }))}
              />
              <Input
                label={t('documents:sendModal.scholarshipType', 'Scholarship type')}
                value={form.scholarshipKind}
                onChange={(event) => setForm((state) => ({ ...state, scholarshipKind: event.target.value }))}
              />
            </>
          ) : null}
        </div>

        <Textarea
          label={t('documents:sendModal.offerConditions', 'Offer conditions')}
          rows={3}
          value={form.offerConditions}
          onChange={(event) => setForm((state) => ({ ...state, offerConditions: event.target.value }))}
        />
        <Textarea
          label={t('documents:sendModal.optionalUniversityMessage', 'Optional university message')}
          rows={3}
          value={form.universityMessage}
          onChange={(event) => setForm((state) => ({ ...state, universityMessage: event.target.value }))}
        />

        {previewScene ? (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">{t('documents:sendModal.preview', 'Preview')}</h3>
            <DocumentCanvasStage scene={previewScene} zoom={0.32} />
            <DocumentSummaryPanel
              payload={previewData?.renderedPayload}
              fallbackDeadline={form.acceptDeadline || undefined}
              heading={t('documents:sendModal.previewDetails', 'Preview details')}
            />
          </div>
        ) : null}
      </div>
    </Modal>
  )
}

function buildDocumentData(form: SendDocumentFormState) {
  return {
    offer: {
      programName: form.offerProgramName,
      degreeLevel: form.offerDegreeLevel,
      intake: form.offerIntake,
      startDate: form.offerStartDate,
      tuitionFee: form.offerTuitionFee,
      currency: form.offerCurrency,
      conditions: form.offerConditions,
    },
    scholarship: {
      amount: form.scholarshipAmount,
      percent: form.scholarshipPercent,
      type: form.scholarshipKind,
    },
  }
}
