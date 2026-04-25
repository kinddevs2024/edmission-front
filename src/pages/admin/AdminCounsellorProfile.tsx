import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { PageTitle } from '@/components/ui/PageTitle'
import { Textarea } from '@/components/ui/Textarea'
import {
  downloadCounsellorStudentsExcelByUser,
  getCounsellorProfileByUser,
  updateCounsellorProfileByUser,
  uploadCounsellorStudentsExcelByUser,
  type AdminCounsellorStudentsImportResult,
} from '@/services/admin'
import { toastApiError } from '@/utils/toastError'
import { Download, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'

export function AdminCounsellorProfile() {
  const { userId } = useParams<{ userId: string }>()
  const { t } = useTranslation(['common', 'admin'])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [schoolName, setSchoolName] = useState('')
  const [schoolDescription, setSchoolDescription] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [importingExcel, setImportingExcel] = useState(false)
  const [importResult, setImportResult] = useState<AdminCounsellorStudentsImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!userId) return
    getCounsellorProfileByUser(userId)
      .then((profile) => {
        setSchoolName(profile.schoolName)
        setSchoolDescription(profile.schoolDescription)
        setCountry(profile.country)
        setCity(profile.city)
        setIsPublic(profile.isPublic)
      })
      .catch(toastApiError)
      .finally(() => setLoading(false))
  }, [userId])

  const handleSave = () => {
    if (!userId) return
    setSaving(true)
    updateCounsellorProfileByUser(userId, {
      schoolName,
      schoolDescription,
      country,
      city,
      isPublic,
    })
      .then(() => toast.success(t('common:saved', 'Saved')))
      .catch(toastApiError)
      .finally(() => setSaving(false))
  }

  const handleExcelSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!userId || !file) return
    setImportingExcel(true)
    uploadCounsellorStudentsExcelByUser(userId, file)
      .then((res) => {
        setImportResult(res)
        toast.success(t('admin:studentsImportFinished', 'Import finished. Created: {{created}}, updated: {{updated}}.', {
          created: res.created,
          updated: res.updated,
        }))
      })
      .catch(toastApiError)
      .finally(() => setImportingExcel(false))
  }

  if (!userId) {
    return (
      <div className="space-y-4">
        <BackLink to="/admin/users">{t('common:back', 'Back')}</BackLink>
        <p className="text-[var(--color-text-muted)]">{t('admin:invalidUser', 'Invalid user.')}</p>
      </div>
    )
  }

  if (loading) return <p className="text-[var(--color-text-muted)] py-6">{t('common:loading', 'Loading...')}</p>

  return (
    <div className="space-y-4">
      <BackLink to="/admin/users">{t('admin:backToUsers', 'Back to users')}</BackLink>
      <PageTitle title={t('admin:schoolProfile', 'School profile')} icon="Building2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={<Download size={16} />}
            onClick={() => downloadCounsellorStudentsExcelByUser(userId).catch(toastApiError)}
          >
            {t('admin:downloadStudentsExcel', 'Download students Excel')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={handleExcelSelected}
          />
          <Button
            size="sm"
            variant="secondary"
            icon={<Upload size={16} />}
            loading={importingExcel}
            disabled={importingExcel}
            onClick={() => fileInputRef.current?.click()}
          >
            {t('admin:uploadExcel', 'Upload Excel')}
          </Button>
        </div>
      </PageTitle>
      <Card>
        <CardTitle className="mb-4">{t('admin:schoolProfile', 'School profile')}</CardTitle>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          {t('admin:schoolProfileHint', 'This information is shown to students when they search for a school to join.')}
        </p>
        <div className="space-y-3 max-w-md">
          <Input label={t('admin:schoolName', 'School name')} value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
          <Textarea
            label={t('admin:schoolDescription', 'Description')}
            value={schoolDescription}
            onChange={(e) => setSchoolDescription(e.target.value)}
            rows={3}
          />
          <Input label={t('admin:country', 'Country')} value={country} onChange={(e) => setCountry(e.target.value)} />
          <Input label={t('admin:city', 'City')} value={city} onChange={(e) => setCity(e.target.value)} />
          <Checkbox
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            label={t('admin:schoolVisibleInList', 'Show school in list for students')}
          />
          <Button onClick={handleSave} loading={saving} disabled={saving}>{t('common:save', 'Save')}</Button>
        </div>
      </Card>
      <Modal
        open={!!importResult}
        onClose={() => setImportResult(null)}
        title={t('admin:excelImportResult', 'Excel import result')}
        footer={<Button onClick={() => setImportResult(null)}>{t('common:close', 'Close')}</Button>}
      >
        {importResult && (
          <div className="space-y-3 text-sm">
            <p>
              {t('admin:studentsImportFinished', 'Import finished. Created: {{created}}, updated: {{updated}}.', {
                created: importResult.created,
                updated: importResult.updated,
              })}
            </p>
            {importResult.errors.length > 0 && (
              <div>
                <p className="font-medium text-red-500 mb-2">
                  {t('admin:importErrors', 'Errors')}: {importResult.errors.length}
                </p>
                <ul className="max-h-64 overflow-y-auto space-y-1 text-[var(--color-text-muted)]">
                  {importResult.errors.slice(0, 20).map((error, index) => (
                    <li key={`${error.row}-${index}`}>
                      {t('admin:row', 'Row')} {error.row}: {error.name ? `${error.name} - ` : ''}{error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
