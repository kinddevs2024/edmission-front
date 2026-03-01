import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageTitle } from '@/components/ui/PageTitle'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { updateProfile } from '@/services/university'
import { getApiError } from '@/services/auth'

const STEPS = [
  { id: 1, title: 'Overview' },
  { id: 2, title: 'Media & Location' },
  { id: 3, title: 'Programs & Academics' },
  { id: 4, title: 'Campus Life & Services' },
  { id: 5, title: 'Contact & Review' },
]

const step1Schema = z.object({
  name: z.string().min(1),
  slogan: z.string().optional(),
  foundedYear: z.coerce.number().optional(),
  studentCount: z.coerce.number().optional(),
  accreditation: z.string().optional(),
  rating: z.coerce.number().min(0).max(100).optional(),
  description: z.string().optional(),
})

export function UniversityOnboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
  })

  const onStep1 = (data: z.infer<typeof step1Schema>) => {
    if (step < 5) setStep((s) => s + 1)
    else submitFull(data)
  }

  const submitFull = async (data: z.infer<typeof step1Schema>) => {
    setError('')
    setSubmitting(true)
    try {
      await updateProfile({
        name: data.name,
        slogan: data.slogan || undefined,
        foundedYear: data.foundedYear ?? undefined,
        studentCount: data.studentCount ?? undefined,
        description: data.description || undefined,
      })
      navigate('/university/dashboard')
    } catch (e) {
      setError(getApiError(e).message)
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageTitle title="University onboarding" icon="GraduationCap" />

      <div className="flex gap-2 overflow-x-auto pb-2">
        {STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(s.id)}
            className={`px-3 py-1.5 rounded-input text-sm font-medium whitespace-nowrap ${
              step === s.id ? 'bg-primary-accent text-primary-dark' : 'bg-[var(--color-border)]'
            }`}
          >
            {s.id}. {s.title}
          </button>
        ))}
      </div>

      <Card>
        <CardTitle>{STEPS[step - 1].title}</CardTitle>

        {step === 1 && (
          <form onSubmit={handleSubmit(onStep1)} className="space-y-4 mt-4">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Input label="University name" error={errors.name?.message} {...register('name')} />
            <Input label="Slogan" {...register('slogan')} />
            <Input label="Founded year" type="number" {...register('foundedYear')} />
            <Input label="Number of students" type="number" {...register('studentCount')} />
            <Input label="Accreditation" {...register('accreditation')} />
            <Input label="Rating (0-100)" type="number" {...register('rating')} />
            <label className="block">
              <span className="block text-sm font-medium mb-1">Description</span>
              <textarea className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2" rows={4} {...register('description')} />
            </label>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} loading={submitting}>Next</Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/university/dashboard')}>Skip</Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4 mt-4">
            <Input label="Country" />
            <Input label="City" />
            <p className="text-sm text-[var(--color-text-muted)]">Campus photos & video upload (TODO)</p>
            <div className="flex gap-2">
              <Button onClick={() => setStep(2 + 1)}>Next</Button>
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-[var(--color-text-muted)]">Programs, degrees, tuition, requirements (TODO)</p>
            <div className="flex gap-2">
              <Button onClick={() => setStep(3 + 1)}>Next</Button>
              <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-[var(--color-text-muted)]">Housing, clubs, facilities (TODO)</p>
            <div className="flex gap-2">
              <Button onClick={() => setStep(4 + 1)}>Next</Button>
              <Button variant="secondary" onClick={() => setStep(3)}>Back</Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4 mt-4">
            <Input label="Contact email" type="email" />
            <Input label="Phone" />
            <p className="text-sm text-[var(--color-text-muted)]">Review and submit. Data from step 1 will be saved.</p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" onClick={() => handleSubmit(submitFull)()} disabled={submitting} loading={submitting}>Submit</Button>
              <Button type="button" variant="secondary" onClick={() => setStep(4)}>Back</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
