import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageTitle } from '@/components/ui/PageTitle'
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge'
import { listIssuedDocuments } from '@/services/documents'
import { toastApiError } from '@/utils/toastError'
import { Gift, FileText } from 'lucide-react'
import type { UniversityDocumentSummary } from '@/types/documentModule'

export function StudentOffers() {
  const { t } = useTranslation(['documents', 'common'])
  const [documents, setDocuments] = useState<UniversityDocumentSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listIssuedDocuments()
      .then(setDocuments)
      .catch((error) => {
        toastApiError(error)
        setDocuments([])
      })
      .finally(() => setLoading(false))
  }, [])

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

      {documents.length === 0 ? (
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
          {documents.map((document) => (
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
              <Button to={`/student/received-documents/${document.id}`} icon={<FileText className="w-4 h-4" />}>
                {t('documents:studentOffers.openDocument', 'Open document')}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
