import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { GraduationCap, MessageCircle, Sparkles } from 'lucide-react'
import { trackStudentFunnel } from '@/analytics/studentFunnel'
import { useStudentOnboardingFlowStore } from '@/store/studentOnboardingFlowStore'
import { MACRO_ONBOARDING_STORAGE_KEY } from '@/constants/studentOnboarding'

function readDone(): boolean {
  try {
    return localStorage.getItem(MACRO_ONBOARDING_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function markMacroOnboardingDone() {
  try {
    localStorage.setItem(MACRO_ONBOARDING_STORAGE_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function resetMacroOnboardingForReplay() {
  try {
    localStorage.removeItem(MACRO_ONBOARDING_STORAGE_KEY)
  } catch {
    /* ignore */
  }
  useStudentOnboardingFlowStore.getState().resetMacroOnboardingGate()
}

export function hasCompletedMacroOnboarding(): boolean {
  return readDone()
}

const TELEGRAM_LINK = import.meta.env.VITE_TELEGRAM_BOT_URL as string | undefined

interface StudentMacroOnboardingProps {
  open: boolean
  onClose: () => void
}

export function StudentMacroOnboarding({ open, onClose }: StudentMacroOnboardingProps) {
  const { t } = useTranslation(['student', 'common'])
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const total = 3

  const setMacroGate = useStudentOnboardingFlowStore((s) => s.setMacroOnboardingDone)

  const finish = (kind: 'complete' | 'skip') => {
    markMacroOnboardingDone()
    setMacroGate()
    if (kind === 'complete') trackStudentFunnel('student_macro_onboarding_complete')
    else trackStudentFunnel('student_macro_onboarding_skip')
    setStep(0)
    onClose()
  }

  const handleSkip = () => finish('skip')

  return (
    <Modal
      open={open}
      onClose={handleSkip}
      title={
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-lg font-semibold">{t('macroOnboardingTitle', 'Welcome to Edmission')}</span>
          <span className="text-xs font-medium text-[var(--color-text-muted)]" aria-live="polite">
            {step + 1} / {total}
          </span>
        </div>
      }
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] min-h-[44px] px-2"
          >
            {t('onboardingSkip', 'Skip for now')}
          </button>
          <div className="flex gap-2">
            {step > 0 ? (
              <Button type="button" variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))}>
                {t('common:back', 'Back')}
              </Button>
            ) : null}
            {step < total - 1 ? (
              <Button type="button" onClick={() => setStep((s) => s + 1)}>
                {t('common:next', 'Next')}
              </Button>
            ) : (
              <Button type="button" onClick={() => finish('complete')}>
                {t('macroOnboardingDone', 'Start using Edmission')}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-1.5" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={total}>
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary-accent' : 'bg-[var(--color-border)]'}`}
            />
          ))}
        </div>

        {step === 0 ? (
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-accent/15 text-primary-accent">
              <Sparkles className="h-6 w-6" aria-hidden />
            </div>
            <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
              {t(
                'macroOnboardingStep1',
                'We match you with universities and programs that fit your profile. You stay in control — show interest when you are ready.'
              )}
            </p>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-accent/15 text-primary-accent">
              <GraduationCap className="h-6 w-6" aria-hidden />
            </div>
            <p className="font-medium text-[var(--color-text)]">{t('macroOnboardingStep2Title', 'Three quick wins')}</p>
            <ul className="list-inside list-disc space-y-2 text-sm text-[var(--color-text-muted)]">
              <li>{t('macroOnboardingStep2a', 'Complete your profile — better matches.')}</li>
              <li>{t('macroOnboardingStep2b', 'Explore the catalog — save universities you like.')}</li>
              <li>{t('macroOnboardingStep2c', 'Show interest — track everything in one place.')}</li>
            </ul>
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => {
                finish('complete')
                navigate('/student/profile')
              }}
            >
              {t('macroOnboardingGoProfile', 'Go to profile')}
            </Button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-accent/15 text-primary-accent">
              <MessageCircle className="h-6 w-6" aria-hidden />
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
              {t(
                'telegramRemindersHint',
                'Get reminders where you already chat. Link Telegram in account settings when you are ready.'
              )}
            </p>
            {TELEGRAM_LINK ? (
              <a
                href={TELEGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center text-sm font-medium text-primary-accent hover:underline"
              >
                {t('macroOnboardingTelegramOpen', 'Open Telegram bot')}
              </a>
            ) : (
              <Link to="/profile" className="inline-flex min-h-[44px] items-center text-sm font-medium text-primary-accent hover:underline" onClick={() => finish('complete')}>
                {t('macroOnboardingAccountLink', 'Account & notifications')}
              </Link>
            )}
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
