import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, DollarSign, Heart, User } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { BrandMark } from '@/components/layout/BrandLogo'
import { FIELD_OF_STUDY } from '@/constants/fieldOfStudy'
import { getProfileCriteria } from '@/services/options'
import { updateProfile } from '@/services/auth'
import { getStudentProfile, updateStudentProfile } from '@/services/student'
import { needsStudentRegistrationOnboarding } from '@/utils/studentRegistrationOnboarding'
import { toastApiError } from '@/utils/toastError'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'

type Step = 'name' | 'faculty' | 'hobby' | 'budget'

const STEPS: Step[] = ['name', 'faculty', 'hobby', 'budget']

function FacultyMarqueeLabel({ text }: { text: string }) {
  return <span className="block truncate font-medium text-[var(--color-text)]">{text}</span>
}

export function StudentRegistrationOnboarding() {
  const { t } = useTranslation(['student', 'common', 'auth'])
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('name')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [firstName, setFirstName] = useState('')
  const [selectedFaculties, setSelectedFaculties] = useState<string[]>([])
  const [openFacultyId, setOpenFacultyId] = useState<string | null>(null)
  const [hobbies, setHobbies] = useState<string[]>([])
  const [hobbyOptions, setHobbyOptions] = useState<string[]>([])
  const [budgetAmount, setBudgetAmount] = useState('')
  const [budgetCurrency, setBudgetCurrency] = useState('USD')

  const stepIndex = STEPS.indexOf(step)
  const totalSteps = STEPS.length

  useEffect(() => {
    let cancelled = false
    Promise.all([getStudentProfile(), getProfileCriteria()])
      .then(([profile, criteria]) => {
        if (cancelled) return
        if (!needsStudentRegistrationOnboarding(profile)) {
          navigate('/student/dashboard', { replace: true })
          return
        }
        setFirstName(String(profile.firstName ?? '').trim())
        setSelectedFaculties(profile.interestedFaculties ?? [])
        setHobbies(profile.hobbies ?? [])
        if (profile.budgetAmount != null) setBudgetAmount(String(profile.budgetAmount))
        if (profile.budgetCurrency) setBudgetCurrency(profile.budgetCurrency)
        setHobbyOptions(criteria.hobbies ?? [])
        if (!String(profile.firstName ?? '').trim()) setStep('name')
        else if (!(profile.interestedFaculties?.length)) setStep('faculty')
        else if (!(profile.hobbies?.length)) setStep('hobby')
        else setStep('budget')
      })
      .catch((err) => {
        if (!cancelled) toastApiError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [navigate])

  const stepMeta = useMemo(
    () =>
      ({
        name: {
          icon: User,
          title: t('registrationOnboardingNameTitle', 'What is your name?'),
          hint: t('registrationOnboardingNameHint', 'Enter your first name so universities know how to address you.'),
        },
        faculty: {
          icon: BookOpen,
          title: t('registrationOnboardingFacultyTitle', 'Where do you want to study?'),
          hint: t(
            'registrationOnboardingFacultyHint',
            'Choose one or more directions — medicine, IT, business, and more. Universities will see your choice.'
          ),
        },
        hobby: {
          icon: Heart,
          title: t('registrationOnboardingHobbyTitle', 'What are your hobbies?'),
          hint: t('registrationOnboardingHobbyHint', 'Pick a few hobbies that describe you.'),
        },
        budget: {
          icon: DollarSign,
          title: t('registrationOnboardingBudgetTitle', 'What is your study budget?'),
          hint: t('registrationOnboardingBudgetHint', 'Enter how much you can spend per year (approximate).'),
        },
      }) satisfies Record<Step, { icon: typeof User; title: string; hint: string }>,
    [t]
  )

  const validateStep = (): string | null => {
    if (step === 'name') {
      if (!firstName.trim()) return t('registrationOnboardingNameRequired', 'Please enter your name')
    }
    if (step === 'faculty') {
      if (selectedFaculties.length === 0) {
        return t('registrationOnboardingFacultyRequired', 'Select at least one direction')
      }
    }
    if (step === 'hobby') {
      if (hobbies.length === 0) return t('registrationOnboardingHobbyRequired', 'Select at least one hobby')
    }
    if (step === 'budget') {
      const amount = Number(budgetAmount)
      if (!budgetAmount.trim() || Number.isNaN(amount) || amount < 0) {
        return t('registrationOnboardingBudgetRequired', 'Enter your budget amount')
      }
    }
    return null
  }

  const goNext = () => {
    const msg = validateStep()
    if (msg) {
      setError(msg)
      return
    }
    setError('')
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
    else void finish()
  }

  const finish = async () => {
    const msg = validateStep()
    if (msg) {
      setError(msg)
      return
    }
    setSaving(true)
    setError('')
    try {
      const trimmedName = firstName.trim()
      const amount = Number(budgetAmount)
      await Promise.all([
        updateStudentProfile({
          firstName: trimmedName,
          interestedFaculties: selectedFaculties,
          hobbies,
          budgetAmount: amount,
          budgetCurrency: budgetCurrency.trim() || 'USD',
        }),
        updateProfile({ name: trimmedName }),
      ])
      const authUser = useAuthStore.getState().user
      if (authUser) {
        useAuthStore.getState().setUser({ ...authUser, name: trimmedName })
      }
      navigate('/student/dashboard', { replace: true })
    } catch (err) {
      toastApiError(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-[var(--color-text-muted)]">{t('common:loading', 'Loading…')}</p>
      </div>
    )
  }

  const { icon: StepIcon, title, hint } = stepMeta[step]

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col py-6 sm:py-10">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-[var(--color-border)] p-6">
          <div className="flex items-center gap-3">
            <BrandMark className="h-10 w-10 shrink-0" />
            <div className="min-w-0 flex-1">
              <CardTitle>{t('registrationOnboardingTitle', 'Set up your profile')}</CardTitle>
              <p className="text-sm text-[var(--color-text-muted)]">
                {t('registrationOnboardingSubtitle', 'A few quick steps — then you are in.')}
              </p>
            </div>
            <span className="text-xs font-medium text-[var(--color-text-muted)]">
              {stepIndex + 1} / {totalSteps}
            </span>
          </div>
          <div className="mt-4 flex gap-1.5" role="progressbar" aria-valuenow={stepIndex + 1} aria-valuemin={1} aria-valuemax={totalSteps}>
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={cn('h-1.5 flex-1 rounded-full', i <= stepIndex ? 'bg-primary-accent' : 'bg-[var(--color-border)]')}
              />
            ))}
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-accent/12 text-primary-accent">
              <StepIcon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{hint}</p>
            </div>
          </div>

          {step === 'name' ? (
            <Input
              label={t('firstName', 'First name')}
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value)
                setError('')
              }}
              autoFocus
              autoComplete="given-name"
              placeholder={t('registrationOnboardingNamePlaceholder', 'Your name')}
            />
          ) : null}

          {step === 'faculty' ? (
            <div className="grid max-h-[min(52vh,420px)] gap-3 overflow-y-auto sm:grid-cols-2">
              {FIELD_OF_STUDY.map((cat) => {
                const selected = selectedFaculties.includes(cat.id)
                const open = openFacultyId === cat.id
                return (
                  <div
                    key={cat.id}
                    className={cn(
                      'self-start rounded-card border-2 bg-[var(--color-card)] transition-all',
                      selected ? 'border-primary-accent ring-1 ring-primary-accent/20' : 'border-[var(--color-border)]'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 p-3">
                      <Checkbox
                        checked={selected}
                        onChange={(e) => {
                          setError('')
                          setSelectedFaculties((current) => {
                            if (e.target.checked) {
                              return Array.from(new Set([...current, cat.id])).slice(0, 5)
                            }
                            return current.filter((x) => x !== cat.id)
                          })
                        }}
                        label={<FacultyMarqueeLabel text={t(cat.titleKey)} />}
                        className="min-w-0 flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => setOpenFacultyId(open ? null : cat.id)}
                        className="shrink-0 rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-border)]"
                        aria-expanded={open}
                      >
                        <svg className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    {open ? (
                      <div className="border-t border-[var(--color-border)] px-3 py-2.5">
                        <p className="mb-1.5 text-xs font-medium text-[var(--color-text-muted)]">{t('common:includes', 'Includes')}</p>
                        <ul className="space-y-1 text-sm text-[var(--color-text-muted)]">
                          {cat.items.map((item) => (
                            <li key={item} className="flex items-center gap-2">
                              <span className="h-1 w-1 shrink-0 rounded-full bg-[var(--color-text-muted)]" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : null}

          {step === 'hobby' ? (
            <ChipSelect
              options={hobbyOptions}
              value={hobbies}
              onChange={(value) => {
                setHobbies(value)
                setError('')
              }}
              max={10}
              placeholder={t('hobbiesPlaceholder', 'Select hobbies')}
            />
          ) : null}

          {step === 'budget' ? (
            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <Input
                label={t('budgetAmount', 'Budget per year')}
                type="number"
                min={0}
                value={budgetAmount}
                onChange={(e) => {
                  setBudgetAmount(e.target.value)
                  setError('')
                }}
                autoFocus
                placeholder="5000"
              />
              <Input
                label={t('budgetCurrency', 'Currency')}
                value={budgetCurrency}
                onChange={(e) => setBudgetCurrency(e.target.value.toUpperCase().slice(0, 3))}
                placeholder="USD"
              />
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={stepIndex === 0 || saving}
              onClick={() => {
                setError('')
                setStep(STEPS[Math.max(0, stepIndex - 1)])
              }}
            >
              {t('common:back', 'Back')}
            </Button>
            <Button type="button" loading={saving} disabled={saving} onClick={goNext}>
              {step === 'budget'
                ? t('registrationOnboardingFinish', 'Go to my account')
                : t('common:next', 'Next')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
