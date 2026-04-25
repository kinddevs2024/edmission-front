import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageTitle } from '@/components/ui/PageTitle'
import { Select } from '@/components/ui/Select'
import { Table, TableBody, TableHead, TableRow, TableTd, TableTh, Pagination } from '@/components/ui/Table'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge'
import { listMyOffers, listMyStudents, type CounsellorOffer, type CounsellorStudent } from '@/services/counsellor'
import { formatDate } from '@/utils/format'
import { toastApiError } from '@/utils/toastError'
import { Gift } from 'lucide-react'
import type { StudentDocumentStatus } from '@/types/documentModule'

function formatMaybeDate(value?: string) {
  return value ? formatDate(value) : '-'
}

export function CounsellorOffers() {
  const { t } = useTranslation(['common', 'documents', 'school'])
  const [items, setItems] = useState<CounsellorOffer[]>([])
  const [students, setStudents] = useState<CounsellorStudent[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [studentUserId, setStudentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const limit = 20

  useEffect(() => {
    listMyStudents({ page: 1, limit: 100 })
      .then((res) => setStudents(res.data ?? []))
      .catch(() => setStudents([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    listMyOffers({
      page,
      limit,
      status: status || undefined,
      type: type || undefined,
      studentUserId: studentUserId || undefined,
    })
      .then((res) => {
        setItems(res.data ?? [])
        setTotal(res.total ?? 0)
      })
      .catch((error) => {
        toastApiError(error)
        setItems([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [page, status, type, studentUserId])

  const studentOptions = useMemo(
    () => [
      { value: '', label: t('school:allStudents', 'All students') },
      ...students.map((student) => ({
        value: student.userId,
        label: student.name || [student.firstName, student.lastName].filter(Boolean).join(' ') || student.email,
      })),
    ],
    [students, t]
  )

  const statusOptions = [
    { value: '', label: t('documents:status.all', 'All statuses') },
    { value: 'sent', label: t('documents:status.sent', 'Sent') },
    { value: 'viewed', label: t('documents:status.viewed', 'Viewed') },
    { value: 'postponed', label: t('documents:status.postponed', 'Postponed') },
    { value: 'accepted', label: t('documents:status.accepted', 'Accepted') },
    { value: 'declined', label: t('documents:status.declined', 'Rejected') },
    { value: 'expired', label: t('documents:status.expired', 'Expired') },
    { value: 'revoked', label: t('documents:status.revoked', 'Revoked') },
  ]

  const typeOptions = [
    { value: '', label: t('documents:type.all', 'All types') },
    { value: 'offer', label: t('documents:type.offer', 'Offer') },
    { value: 'scholarship', label: t('documents:type.scholarship', 'Scholarship') },
  ]

  return (
    <div className="space-y-4">
      <PageTitle title={t('school:offers', 'Offers')} icon="Gift" />

      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          <Select
            label={t('school:student', 'Student')}
            options={studentOptions}
            value={studentUserId}
            onChange={(event) => { setStudentUserId(event.target.value); setPage(1) }}
          />
          <Select
            label={t('documents:common.type', 'Type')}
            options={typeOptions}
            value={type}
            onChange={(event) => { setType(event.target.value); setPage(1) }}
          />
          <Select
            label={t('common:status', 'Status')}
            options={statusOptions}
            value={status}
            onChange={(event) => { setStatus(event.target.value); setPage(1) }}
          />
        </div>

        <CardTitle className="mb-2">{t('school:studentOffers', 'Student offers')}</CardTitle>
        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Gift className="w-14 h-14 text-[var(--color-text-muted)] opacity-60" />}
            title={t('school:noOffersYet', 'No offers yet')}
            description={t('school:noOffersYetHint', 'When universities send offers or scholarships to your students, they will appear here.')}
          />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableTh>{t('school:student', 'Student')}</TableTh>
                  <TableTh>{t('documents:common.document', 'Document')}</TableTh>
                  <TableTh>{t('common:university', 'University')}</TableTh>
                  <TableTh>{t('documents:common.type', 'Type')}</TableTh>
                  <TableTh>{t('common:status', 'Status')}</TableTh>
                  <TableTh>{t('documents:studentOffers.sent', 'Sent')}</TableTh>
                  <TableTh>{t('documents:studentOffers.deadline', 'Deadline')}</TableTh>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableTd>
                      <div className="font-medium">{item.studentName || '-'}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{item.studentEmail}</div>
                    </TableTd>
                    <TableTd>
                      <div className="font-medium">{item.title || t('documents:common.document', 'Document')}</div>
                      {item.universityMessage && (
                        <div className="text-xs text-[var(--color-text-muted)] line-clamp-2">{item.universityMessage}</div>
                      )}
                    </TableTd>
                    <TableTd>{item.university?.name || item.universityId || '-'}</TableTd>
                    <TableTd>{item.type === 'offer' ? t('documents:type.offer', 'Offer') : t('documents:type.scholarship', 'Scholarship')}</TableTd>
                    <TableTd><DocumentStatusBadge status={item.status as StudentDocumentStatus} /></TableTd>
                    <TableTd>{formatMaybeDate(item.sentAt)}</TableTd>
                    <TableTd>{item.expiresAt ? formatDate(item.expiresAt) : t('documents:summary.openEnded', 'Open ended')}</TableTd>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  )
}
