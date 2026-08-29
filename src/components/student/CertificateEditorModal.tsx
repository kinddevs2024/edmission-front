import { useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { StudentProfileData } from '@/services/student'
import type { AcademicCertificateFieldId } from '@/utils/academicCertificate'
import { getWorldCountryLabelsSorted } from '@/utils/worldCountries'

interface CertificateEditorModalProps {
  field: AcademicCertificateFieldId | null
  profile: StudentProfileData | null
  onClose: () => void
  onSave: (patch: Partial<StudentProfileData>) => Promise<void>
}
const FIELD_TITLES: Record<AcademicCertificateFieldId, string> = {
  name: 'Add your certificate name',
  location: 'Add your location',
  school: 'Add your institution',
  graduationYear: 'Add your graduation year',
  gpa: 'Add your academic result',
  degree: 'Choose your intended degree',
  language: 'Add your English level',
  academicFocus: 'Add your academic focus',
  destinations: 'Choose your study destinations',
}

function splitList(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 10)
}

export function CertificateEditorModal({ field, profile, onClose, onSave }: CertificateEditorModalProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const countries = useMemo(() => getWorldCountryLabelsSorted().map((country) => ({ value: country, label: country })), [])

  useEffect(() => {
    if (!field || !profile) return
    setError('')
    setValues({
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      country: profile.country ?? '',
      city: profile.city ?? '',
      schoolName: profile.schoolName ?? profile.schoolsAttended?.[0]?.institutionName ?? '',
      graduationYear: profile.graduationYear ? String(profile.graduationYear) : '',
      gpa: profile.gpa != null ? String(profile.gpa) : '',
      targetDegreeLevel: profile.targetDegreeLevel ?? '',
      languageLevel: profile.languageLevel ?? profile.languages?.[0]?.level ?? '',
      academicFocus: (profile.interestedFaculties?.length ? profile.interestedFaculties : profile.interests)?.join(', ') ?? '',
      destinations: profile.preferredCountries?.join(', ') ?? '',
    })
  }, [field, profile])

  const setValue = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }))

  const buildPatch = (): Partial<StudentProfileData> => {
    switch (field) {
      case 'name':
        return { firstName: values.firstName?.trim(), lastName: values.lastName?.trim() }
      case 'location':
        return { country: values.country?.trim(), city: values.city?.trim() }
      case 'school':
        return { schoolName: values.schoolName?.trim() }
      case 'graduationYear':
        return { graduationYear: values.graduationYear ? Number(values.graduationYear) : undefined }
      case 'gpa':
        return { gpa: values.gpa ? Number(values.gpa) : undefined }
      case 'degree':
        return { targetDegreeLevel: values.targetDegreeLevel as StudentProfileData['targetDegreeLevel'] }
      case 'language':
        return { languageLevel: values.languageLevel?.trim() }
      case 'academicFocus':
        return { interestedFaculties: splitList(values.academicFocus ?? '') }
      case 'destinations':
        return { preferredCountries: splitList(values.destinations ?? '') }
      default:
        return {}
    }
  }

  const save = async () => {
    if (!field) return
    setSaving(true)
    setError('')
    try {
      await onSave(buildPatch())
      onClose()
    } catch {
      setError('We could not save this field yet. Please check the value and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={Boolean(field)}
      onClose={saving ? () => {} : onClose}
      title={field ? FIELD_TITLES[field] : ''}
      panelClassName="sm:max-w-xl"
      footer={(
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="button" onClick={save} loading={saving}>Update certificate</Button>
        </>
      )}
    >
      <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-muted)]">Your certificate updates as soon as this information is saved.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {field === 'name' ? (
          <>
            <Input label="First name" value={values.firstName ?? ''} onChange={(event) => setValue('firstName', event.target.value)} autoFocus />
            <Input label="Last name" value={values.lastName ?? ''} onChange={(event) => setValue('lastName', event.target.value)} />
          </>
        ) : null}
        {field === 'location' ? (
          <>
            <Select label="Country" value={values.country ?? ''} options={countries} placeholder="Choose country" onChange={(event) => setValue('country', event.target.value)} />
            <Input label="City" value={values.city ?? ''} onChange={(event) => setValue('city', event.target.value)} autoFocus />
          </>
        ) : null}
        {field === 'school' ? <Input className="sm:col-span-2" label="School or college" value={values.schoolName ?? ''} onChange={(event) => setValue('schoolName', event.target.value)} autoFocus /> : null}
        {field === 'graduationYear' ? <Input label="Graduation year" type="number" min={1950} max={2100} value={values.graduationYear ?? ''} onChange={(event) => setValue('graduationYear', event.target.value)} autoFocus /> : null}
        {field === 'gpa' ? <Input label="GPA" type="number" min={0} max={5} step="0.01" value={values.gpa ?? ''} onChange={(event) => setValue('gpa', event.target.value)} hint="Use your current GPA on a 0–5 scale." autoFocus /> : null}
        {field === 'degree' ? <Select label="Intended degree" value={values.targetDegreeLevel ?? ''} options={[{ value: 'bachelor', label: "Bachelor's" }, { value: 'master', label: "Master's" }, { value: 'phd', label: 'PhD' }]} placeholder="Choose degree" onChange={(event) => setValue('targetDegreeLevel', event.target.value)} /> : null}
        {field === 'language' ? <Input label="English level or exam result" value={values.languageLevel ?? ''} onChange={(event) => setValue('languageLevel', event.target.value)} placeholder="e.g. B2, IELTS 6.5" autoFocus /> : null}
        {field === 'academicFocus' ? <Input className="sm:col-span-2" label="Academic interests" value={values.academicFocus ?? ''} onChange={(event) => setValue('academicFocus', event.target.value)} placeholder="Computer Science, Economics" hint="Separate interests with commas." autoFocus /> : null}
        {field === 'destinations' ? <Input className="sm:col-span-2" label="Preferred countries" value={values.destinations ?? ''} onChange={(event) => setValue('destinations', event.target.value)} placeholder="Canada, Germany, United Kingdom" hint="Separate countries with commas." autoFocus /> : null}
      </div>
      {error ? <p className="mt-4 text-sm text-red-500" role="alert">{error}</p> : null}
    </Modal>
  )
}
