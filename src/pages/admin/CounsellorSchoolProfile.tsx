import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageTitle } from '@/components/ui/PageTitle'
import { getCounsellorProfile, updateCounsellorProfile, type CounsellorProfile as CounsellorProfileType } from '@/services/counsellor'
import { toastApiError } from '@/utils/toastError'

export function CounsellorSchoolProfile() {
  const { t } = useTranslation(['common', 'admin'])
  const [profile, setProfile] = useState<CounsellorProfileType | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [schoolName, setSchoolName] = useState('')
  const [schoolDescription, setSchoolDescription] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  useEffect(() => {
    getCounsellorProfile()
      .then((p) => {
        setProfile(p)
        setSchoolName(p.schoolName ?? '')
        setSchoolDescription(p.schoolDescription ?? '')
        setCountry(p.country ?? '')
        setCity(p.city ?? '')
        setIsPublic(p.isPublic ?? true)
      })
      .catch(toastApiError)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = () => {
    setSaving(true)
    updateCounsellorProfile({ schoolName, schoolDescription, country, city, isPublic })
      .then((p) => {
        setProfile(p)
      })
      .catch(toastApiError)
      .finally(() => setSaving(false))
  }

  if (loading) return <p className="text-[var(--color-text-muted)] py-6">{t('common:loading', 'Loading...')}</p>

  return (
    <div className="space-y-4">
      <PageTitle title={t('admin:mySchool', 'My school')} icon="Building2" />
      <Card>
        <CardTitle className="mb-4">{t('admin:schoolProfile', 'School profile')}</CardTitle>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          {t('admin:schoolProfileHint', 'This information is shown to students when they search for a school to join.')}
        </p>
        <div className="space-y-3 max-w-md">
          <Input
            label={t('admin:schoolName', 'School name')}
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('admin:schoolDescription', 'Description')}</label>
            <textarea
              value={schoolDescription}
              onChange={(e) => setSchoolDescription(e.target.value)}
              rows={3}
              className="w-full rounded-input border bg-[var(--color-card)] px-3 py-2 text-[var(--color-text)]"
            />
          </div>
          <Input label={t('admin:country', 'Country')} value={country} onChange={(e) => setCountry(e.target.value)} />
          <Input label={t('admin:city', 'City')} value={city} onChange={(e) => setCity(e.target.value)} />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="rounded border-[var(--color-border)]" />
            <span className="text-sm text-[var(--color-text)]">{t('admin:schoolVisibleInList', 'Show school in list for students')}</span>
          </label>
          <Button onClick={handleSave} loading={saving} disabled={saving}>{t('common:save', 'Save')}</Button>
        </div>
      </Card>
    </div>
  )
}
