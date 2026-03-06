import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { getCatalog, createVerificationRequest, type CatalogUniversity } from '@/services/university'
import { Building2, CheckCircle } from 'lucide-react'

export function UniversitySelect() {
  const { t } = useTranslation(['common', 'university'])
  const [list, setList] = useState<CatalogUniversity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    getCatalog({ search: search.trim() || undefined })
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [search])

  const handleSet = async (universityId: string) => {
    setSubmittingId(universityId)
    try {
      await createVerificationRequest(universityId)
      setSent(true)
    } catch {
      setSubmittingId(null)
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
          onChange={(e) => setSearch(e.target.value)}
          className="mb-6 max-w-sm"
        />
        {loading ? (
          <div className="text-[var(--color-text-muted)]">{t('common:loading', 'Loading...')}</div>
        ) : list.length === 0 ? (
          <Card className="p-6">
            <p className="text-[var(--color-text-muted)]">{t('university:noUniversitiesInCatalog', 'No universities found. Try a different search or contact support.')}</p>
          </Card>
        ) : (
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
        )}
      </div>
    </div>
  )
}
