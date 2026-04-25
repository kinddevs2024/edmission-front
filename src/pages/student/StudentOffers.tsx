import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageTitle } from '@/components/ui/PageTitle'
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge'
import { acceptIssuedDocument, declineIssuedDocument, listIssuedDocuments, postponeIssuedDocument } from '@/services/documents'
import { toastApiError } from '@/utils/toastError'
import { notifySuccess } from '@/utils/notify'
import { Gift, FileText, Clock3 } from 'lucide-react'
import type { UniversityDocumentSummary } from '@/types/documentModule'

export function StudentOffers() {
  const { t } = useTranslation(['documents', 'common'])
  const [documents, setDocuments] = useState<UniversityDocumentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'active' | 'accepted' | 'declined' | 'postponed' | 'expired'>('active')
  const [actionId, setActionId] = useState('')

  useEffect(() => {
    listIssuedDocuments()
      .then(setDocuments)
      .catch((error) => {
        toastApiError(error)
        setDocuments([])
      })
      .finally(() => setLoading(false))
  }, [])

  const refreshDocuments = () =>
    listIssuedDocuments()
      .then(setDocuments)
      .catch((error) => {
        toastApiError(error)
        setDocuments([])
      })

  const onAction = async (documentId: string, action: 'accept' | 'decline' | 'postpone') => {
    setActionId(`${documentId}:${action}`)
    try {
      if (action === 'accept') await acceptIssuedDocument(documentId)
      if (action === 'decline') await declineIssuedDocument(documentId)
      if (action === 'postpone') await postponeIssuedDocument(documentId, 7)
      notifySuccess(t('common:saved', 'Saved'))
      await refreshDocuments()
    } catch (error) {
      toastApiError(error)
    } finally {
      setActionId('')
    }
  }

  const filteredDocuments = documents.filter((document) => {
    if (tab === 'active') return document.status === 'sent' || document.status === 'viewed'
    return document.status === tab
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <PageTitle title={t('documents:studentOffers.pageTitle', 'Offers & Scholarships')} icon="Gift" />
        <Card><div className="h-32 animate-pulse rounded bg-[var(--color-border)]" /></Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageTitle title={t('documents:studentOffers.pageTitle', 'Offers & Scholarships')} icon="Gift" />
      <Card className="border-primary-accent/25">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t('documents:studentOffers.decisionCenter', 'Decision center')}</CardTitle>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {t('documents:studentOffers.decisionCenterHint', 'Review deadlines, open documents, and accept, reject, or postpone offers from one place.')}
            </p>
          </div>
          <Button to="/how-edmission-works" variant="secondary">
            {t('documents:studentOffers.howOffersWork', 'How offers work')}
          </Button>
        </div>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          ['active', t('documents:status.active', 'Active')],
          ['postponed', t('documents:status.postponed', 'Postponed')],
          ['accepted', t('documents:status.accepted', 'Accepted')],
          ['declined', t('documents:status.declined', 'Rejected')],
          ['expired', t('documents:status.expired', 'Expired')],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value as typeof tab)}
            className={`min-h-[40px] whitespace-nowrap rounded-input border px-3 text-sm font-medium ${
              tab === value
                ? 'border-primary-accent bg-primary-accent text-white'
                : 'border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-muted)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filteredDocuments.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Gift className="w-14 h-14 text-[var(--color-text-muted)] opacity-60" />}
            title={t('documents:studentOffers.emptyTitle', 'No documents yet')}
            description={t('documents:studentOffers.emptyDescription', 'When a university sends you an offer or scholarship, it will appear here.')}
            actionLabel={t('common:exploreUniversities', 'Explore universities')}
            actionTo="/student/universities"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredDocuments.map((document) => {
            const deadlineMs = document.expiresAt ? new Date(document.expiresAt).getTime() : 0
            const daysLeft = deadlineMs ? Math.ceil((deadlineMs - Date.now()) / 86400000) : null
            const actionable = document.status === 'sent' || document.status === 'viewed' || document.status === 'postponed'
            return (
            <Card key={document.id} className="space-y-4 border border-[var(--color-border)]" interactive>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold">{document.title ?? t('documents:common.document', 'Document')}</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">{document.university?.name ?? t('documents:common.university', 'University')}</p>
                </div>
                <DocumentStatusBadge status={document.status} />
              </div>
              <div className="space-y-1 text-sm text-[var(--color-text-muted)]">
                <p>{t('documents:studentOffers.type', 'Type')}: {document.type === 'offer' ? t('documents:type.offer', 'Offer') : t('documents:type.scholarship', 'Scholarship')}</p>
                <p>{t('documents:studentOffers.sent', 'Sent')}: {new Date(document.sentAt).toLocaleDateString()}</p>
                <p>{t('documents:studentOffers.deadline', 'Deadline')}: {document.expiresAt ? new Date(document.expiresAt).toLocaleDateString() : t('documents:summary.openEnded', 'Open ended')}</p>
              </div>
              {daysLeft != null && daysLeft >= 0 && daysLeft <= 3 ? (
                <div className="flex items-center gap-2 rounded-input border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <Clock3 className="h-4 w-4 shrink-0" aria-hidden />
                  {t('documents:studentOffers.deadlineSoon', { defaultValue: '{{count}} day(s) left to decide', count: daysLeft })}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button to={`/student/received-documents/${document.id}`} icon={<FileText className="w-4 h-4" />}>
                  {t('documents:studentOffers.openDocument', 'Open document')}
                </Button>
                {actionable ? (
                  <>
                    <Button type="button" variant="secondary" loading={actionId === `${document.id}:postpone`} disabled={!!actionId} onClick={() => void onAction(document.id, 'postpone')}>
                      {t('documents:actions.postpone', 'Postpone')}
                    </Button>
                    <Button type="button" variant="secondary" loading={actionId === `${document.id}:decline`} disabled={!!actionId} onClick={() => void onAction(document.id, 'decline')}>
                      {t('documents:actions.reject', 'Reject')}
                    </Button>
                    <Button type="button" loading={actionId === `${document.id}:accept`} disabled={!!actionId} onClick={() => void onAction(document.id, 'accept')}>
                      {t('documents:actions.accept', 'Accept')}
                    </Button>
                  </>
                ) : null}
              </div>
            </Card>
          )})}
        </div>
      )}
    </div>
  )
}
