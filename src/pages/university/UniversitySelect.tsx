import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import axios from 'axios'
import { getCatalog, createVerificationRequest, type CatalogUniversity } from '@/services/university'
import { toastApiError } from '@/utils/toastError'

function getApiError(err: unknown): { message: string; code?: string } | null {
  if (!axios.isAxiosError(err) || !err.response?.data) return null
  const data = err.response.data as { message?: string; code?: string }
  return { message: data.message ?? 'Request failed', code: data.code }
}

function isProfileExistsConflict(err: unknown): boolean {
  const e = getApiError(err)
  return e ? (e.code === 'CONFLICT' && (e.message?.toLowerCase().includes('profile already exists') ?? false)) : false
}

function isRequestAlreadySent(err: unknown): boolean {
  const e = getApiError(err)
  return e ? (e.code === 'CONFLICT' && (e.message?.toLowerCase().includes('request already sent') ?? false)) : false
}
import { Building2, CheckCircle, Plus } from 'lucide-react'

export function UniversitySelect() {
  const { t } = useTranslation(['common', 'university'])
  const navigate = useNavigate()
  const { user } = useAuth()
  const [list, setList] = useState<CatalogUniversity[]>([])

  useEffect(() => {
    if (user?.universityProfile) {
      navigate(user.universityProfile.verified ? '/university/dashboard' : '/university/pending', { replace: true })
    }
  }, [user?.universityProfile, navigate])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [otherOpen, setOtherOpen] = useState(false)
  const [otherName, setOtherName] = useState('')
  const [otherYear, setOtherYear] = useState('')
  const [otherSubmitting, setOtherSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCatalog({ search: search.trim() || undefined })
      .then(setList)
      .catch((e) => { toastApiError(e); setList([]) })
      .finally(() => setLoading(false))
  }, [search])

  const handleSet = async (universityId: string) => {
    setError(null)
    setSubmittingId(universityId)
    try {
      await createVerificationRequest(universityId)
      setSent(true)
    } catch (err: unknown) {
      setSubmittingId(null)
      if (isProfileExistsConflict(err)) {
        navigate('/university/dashboard', { replace: true })
        return
      }
      if (isRequestAlreadySent(err)) {
        navigate('/university/pending', { replace: true })
        return
      }
      const e = getApiError(err)
      setError(e?.message ?? t('common:error', 'Something went wrong'))
    }
  }

  const handleOtherSubmit = async () => {
    const name = otherName.trim()
    if (!name) return
    setError(null)
    setOtherSubmitting(true)
    try {
      await createVerificationRequest({
        universityName: name,
        establishedYear: otherYear.trim() ? parseInt(otherYear, 10) : undefined,
      })
      setOtherOpen(false)
      setOtherName('')
      setOtherYear('')
      setSent(true)
    } catch (err: unknown) {
      if (isProfileExistsConflict(err)) {
        setOtherOpen(false)
        navigate('/university/dashboard', { replace: true })
        return
      }
      if (isRequestAlreadySent(err)) {
        setOtherOpen(false)
        navigate('/university/pending', { replace: true })
        return
      }
      const e = getApiError(err)
      setError(e?.message ?? t('common:error', 'Something went wrong'))
    } finally {
      setOtherSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)]">
        <Card className="max-w-md w-full p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-primary-accent/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-primary-accent" aria-hidden />
          </div>
          <CardTitle className="mb-2">{t('university:requestSentTitle', 'Request sent')}</CardTitle>
          <p className="text-[var(--color-text-muted)] text-sm mb-6">
            {t('university:requestSentMessage', 'We have sent a request to confirm your university account. An administrator will review it and you will be notified once your account is active.')}
          </p>
          <Button to="/university/pending">{t('university:goToPending', 'Go to status page')}</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-2">
          {t('university:selectYourUniversity', 'Select your university')}
        </h1>
        <p className="text-[var(--color-text-muted)] text-sm mb-6">
          {t('university:selectUniversityHint', 'Find your university in the list and click "Set" to send a verification request.')}
        </p>
        <Input
          placeholder={t('common:search', 'Search')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setError(null) }}
          className="mb-6 max-w-sm"
        />
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm" role="alert">
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-[var(--color-text-muted)]">{t('common:loading', 'Loading...')}</div>
        ) : list.length === 0 ? (
          <Card className="p-6">
            <p className="text-[var(--color-text-muted)] mb-4">{t('university:noUniversitiesInCatalog', 'No universities found. Try a different search or add your own.')}</p>
            <Button variant="secondary" size="sm" onClick={() => setOtherOpen(true)} icon={<Plus className="w-4 h-4" />}>
              {t('university:otherUniversity', 'Other')}
            </Button>
          </Card>
        ) : (
          <>
            <ul className="space-y-3">
              {list.map((u) => (
                <li key={u.id}>
                  <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-[var(--color-border)] flex items-center justify-center shrink-0 overflow-hidden">
                        {u.logoUrl ? (
                          <img src={u.logoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-6 h-6 text-[var(--color-text-muted)]" aria-hidden />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--color-text)] truncate">{u.name || u.universityName}</p>
                        {(u.country || u.city) && (
                          <p className="text-sm text-[var(--color-text-muted)] truncate">
                            {[u.city, u.country].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSet(u.id)}
                      disabled={submittingId !== null}
                      loading={submittingId === u.id}
                    >
                      {t('university:setAsMine', 'Set')}
                    </Button>
                  </Card>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
              <p className="text-sm text-[var(--color-text-muted)] mb-2">
                {t('university:notInListHint', "Your university isn't in the list?")}
              </p>
              <Button variant="secondary" size="sm" onClick={() => setOtherOpen(true)} icon={<Plus className="w-4 h-4" />}>
                {t('university:otherUniversity', 'Other')}
              </Button>
            </div>
          </>
        )}
      </div>

      <Modal
        open={otherOpen}
        onClose={() => { setOtherOpen(false); setOtherName(''); setOtherYear('') }}
        title={t('university:otherUniversity', 'Other')}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setOtherOpen(false); setOtherName(''); setOtherYear('') }}>
              {t('common:cancel')}
            </Button>
            <Button onClick={handleOtherSubmit} disabled={otherSubmitting || !otherName.trim()} loading={otherSubmitting}>
              {t('university:sendRequest', 'Send request')}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {error && otherOpen && (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm" role="alert">
              {error}
            </div>
          )}
          <Input
            label={t('university:universityName', 'University name')}
            value={otherName}
            onChange={(e) => { setOtherName(e.target.value); setError(null) }}
            placeholder={t('university:enterUniversityName', 'Enter university name')}
          />
          <Input
            label={t('university:foundedYear', 'Year established')}
            type="number"
            value={otherYear}
            onChange={(e) => setOtherYear(e.target.value)}
            placeholder="e.g. 1990"
          />
          <p className="text-xs text-[var(--color-text-muted)]">
            {t('university:otherUniversityHint', 'A verification request will be sent. An administrator will review and add your university.')}
          </p>
        </div>
      </Modal>
    </div>
  )
}
