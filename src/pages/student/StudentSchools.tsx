import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageTitle } from '@/components/ui/PageTitle'
import axios from 'axios'
import { listSchools, requestToJoinSchool, type SchoolsListResponse } from '@/services/student'
import { toastApiError } from '@/utils/toastError'
import { toast } from 'sonner'

export function StudentSchools() {
  const { t } = useTranslation(['common', 'admin'])
  const [data, setData] = useState<SchoolsListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [requestingId, setRequestingId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    listSchools({ search: search.trim() || undefined, page, limit: 15 })
      .then(setData)
      .catch((e) => {
        toastApiError(e)
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [page, search])

  const handleRequest = (counsellorUserId: string) => {
    setRequestingId(counsellorUserId)
    requestToJoinSchool(counsellorUserId)
      .then(() => {
        toast.success(t('admin:requestSent', 'Request sent'))
        if (data) {
          const updated = data.data.map((s) =>
            s.counsellorUserId === counsellorUserId ? { ...s, requestStatus: 'pending' as const } : s
          )
          setData({ ...data, data: updated })
        }
      })
      .catch((e) => {
        const res = axios.isAxiosError(e) ? e.response?.data : null
        const code = res?.code
        const msg = String(res?.message ?? '').toLowerCase()
        if (code === 'CONFLICT' && (msg.includes('request already sent') || msg.includes('already in this school'))) {
          toast.info(t('admin:requestAlreadySent', 'Request already sent. Waiting for response.'))
          if (data) {
            const updated = data.data.map((s) =>
              s.counsellorUserId === counsellorUserId ? { ...s, requestStatus: 'pending' as const } : s
            )
            setData({ ...data, data: updated })
          }
        } else {
          toastApiError(e)
        }
      })
      .finally(() => setRequestingId(null))
  }

  const list = data?.data ?? []
  const totalPages = data ? Math.max(1, Math.ceil(data.total / (data.limit || 15))) : 1

  return (
    <div className="space-y-4">
      <PageTitle title={t('admin:linkToSchool', 'Link to my school')} icon="Building2" />
      <p className="text-sm text-[var(--color-text-muted)]">
        {t('admin:linkToSchoolHint', 'Find your school and send a request. The counsellor will accept or reject.')}
      </p>

      <Card>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Input
            placeholder={t('common:search', 'Search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <CardTitle>{t('admin:schoolsList', 'Schools')}</CardTitle>
        {loading ? (
          <p className="text-[var(--color-text-muted)] py-6">{t('common:loading', 'Loading...')}</p>
        ) : list.length === 0 ? (
          <p className="text-[var(--color-text-muted)] py-8 text-center">{t('admin:noSchoolsFound', 'No schools found.')}</p>
        ) : (
          <ul className="space-y-3 mt-2">
            {list.map((school) => (
              <li
                key={school.id}
                className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-[var(--color-border)]"
              >
                <div>
                  <p className="font-medium text-[var(--color-text)]">{school.schoolName || t('admin:unnamedSchool', 'Unnamed school')}</p>
                  {school.schoolDescription && <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">{school.schoolDescription}</p>}
                  <p className="text-xs text-[var(--color-text-muted)]">{school.city && school.country ? `${school.city}, ${school.country}` : school.counsellorName}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleRequest(school.counsellorUserId)}
                  disabled={!!requestingId || school.requestStatus === 'pending' || school.requestStatus === 'accepted'}
                  loading={requestingId === school.counsellorUserId}
                >
                  {school.requestStatus === 'accepted'
                    ? t('admin:alreadyInSchool', 'In school')
                    : school.requestStatus === 'pending'
                      ? t('admin:requestSent', 'Request sent')
                      : t('admin:requestToJoin', 'Request to join')}
                </Button>
              </li>
            ))}
          </ul>
        )}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t('common:prev')}</Button>
            <span className="flex items-center px-2 text-[var(--color-text-muted)]">{page} / {totalPages}</span>
            <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>{t('common:next')}</Button>
          </div>
        )}
      </Card>
    </div>
  )
}
