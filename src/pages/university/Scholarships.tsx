import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { PageTitle } from '@/components/ui/PageTitle'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { getScholarships, createScholarship } from '@/services/university'
import { formatDate } from '@/utils/format'
import { toastApiError } from '@/utils/toastError'
import type { Scholarship } from '@/types/university'

export function Scholarships() {
  const { t } = useTranslation(['common', 'university'])
  const [list, setList] = useState<Scholarship[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [coveragePercent, setCoveragePercent] = useState(100)
  const [maxSlots, setMaxSlots] = useState(10)
  const [deadline, setDeadline] = useState('')
  const [eligibility, setEligibility] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getScholarships({ limit: 100 })
      .then((res) => setList(Array.isArray(res) ? res : (res?.data ?? [])))
      .catch((e) => { toastApiError(e); setList([]) })
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = () => {
    setSubmitting(true)
    createScholarship({ name, coveragePercent, maxSlots, deadline, eligibility })
      .then((newOne) => {
        setList((prev) => [newOne, ...prev])
        setModalOpen(false)
        setName('')
        setCoveragePercent(100)
        setMaxSlots(10)
        setDeadline('')
        setEligibility('')
      })
      .catch(toastApiError)
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="space-y-4">
      <PageTitle title={t('university:navScholarships', 'Scholarships')} icon="Wallet" />

      <Card className="animate-card-enter">
        <div className="mb-4 flex items-center justify-between">
          <CardTitle>{t('university:scholarshipList', 'Scholarship list')}</CardTitle>
          <Button onClick={() => setModalOpen(true)} icon={<Plus size={16} />}>{t('university:createScholarship')}</Button>
        </div>
        {loading ? (
          <p className="text-[var(--color-text-muted)]">{t('common:loading')}</p>
        ) : list.length === 0 ? (
          <p className="py-8 text-[var(--color-text-muted)]">{t('university:noScholarshipsYet', 'No scholarships yet. Create one to start.')}</p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableTh>{t('common:name', 'Name')}</TableTh>
                <TableTh>{t('university:coveragePercent', 'Coverage %')}</TableTh>
                <TableTh>{t('university:maxSlots', 'Max slots')}</TableTh>
                <TableTh>{t('university:deadline', 'Deadline')}</TableTh>
                <TableTh>{t('university:eligibility', 'Eligibility')}</TableTh>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((scholarship) => (
                <TableRow key={scholarship.id}>
                  <TableTd>{scholarship.name}</TableTd>
                  <TableTd>{scholarship.coveragePercent}%</TableTd>
                  <TableTd>{scholarship.usedSlots} / {scholarship.maxSlots}</TableTd>
                  <TableTd>{scholarship.deadline ? formatDate(scholarship.deadline) : '—'}</TableTd>
                  <TableTd className="max-w-xs truncate">{scholarship.eligibility ?? '—'}</TableTd>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t('university:createScholarship')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>{t('common:cancel')}</Button>
            <Button onClick={handleCreate} disabled={submitting} loading={submitting}>{t('common:create')}</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label={t('common:name')} value={name} onChange={(e) => setName(e.target.value)} />
          <Input label={t('university:coveragePercent')} type="number" value={coveragePercent} onChange={(e) => setCoveragePercent(Number(e.target.value))} />
          <Input label={t('university:maxSlots')} type="number" value={maxSlots} onChange={(e) => setMaxSlots(Number(e.target.value))} />
          <Input label={t('university:deadline')} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <Textarea label={t('university:eligibility')} rows={3} value={eligibility} onChange={(e) => setEligibility(e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
