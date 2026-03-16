import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ChevronLeft, ChevronRight, User, LayoutDashboard, Search, Bot, FileText } from 'lucide-react'
import { updateProfile } from '@/services/auth'
import { toastApiError } from '@/utils/toastError'

const STORAGE_KEY_STUDENT = 'edmission_tutorial_student_seen'
const STORAGE_KEY_UNIVERSITY = 'edmission_tutorial_university_seen'

export function getTutorialStorageKey(role: 'student' | 'university') {
  return role === 'student' ? STORAGE_KEY_STUDENT : STORAGE_KEY_UNIVERSITY
}

/** When user is provided, we trust only the server (DB). localStorage is used only when user is not loaded yet. */
export function hasSeenTutorial(role: 'student' | 'university', user?: { onboardingTutorialSeen?: { student?: boolean; university?: boolean } } | null): boolean {
  if (user != null && user.onboardingTutorialSeen != null) {
    const seen = role === 'student' ? user.onboardingTutorialSeen.student : user.onboardingTutorialSeen.university
    return seen === true
  }
  try {
    return localStorage.getItem(getTutorialStorageKey(role)) === '1'
  } catch {
    return false
  }
}

export function markTutorialSeen(role: 'student' | 'university') {
  try {
    localStorage.setItem(getTutorialStorageKey(role), '1')
  } catch {
    /* ignore */
  }
}

interface OnboardingTutorialModalProps {
  open: boolean
  onClose: () => void
  variant: 'student' | 'university'
}

export function OnboardingTutorialModal({ open, onClose, variant }: OnboardingTutorialModalProps) {
  const ns = variant
  const { t } = useTranslation([ns, 'common'])
  const [step, setStep] = useState(0)
  const slideCount = 5

  const persistTutorialSeen = () => {
    updateProfile({
      onboardingTutorialSeen: variant === 'student' ? { student: true } : { university: true },
    }).catch(toastApiError)
    markTutorialSeen(variant)
  }

  const handleClose = () => {
    persistTutorialSeen()
    onClose()
  }

  const handleSkip = () => {
    persistTutorialSeen()
    onClose()
  }

  const handleNext = () => {
    if (step < slideCount - 1) setStep((s) => s + 1)
    else handleClose()
  }

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  const slides = [
    { icon: User, titleKey: 'tutorial.slide1Title', bodyKey: 'tutorial.slide1Body' },
    { icon: LayoutDashboard, titleKey: 'tutorial.slide2Title', bodyKey: 'tutorial.slide2Body' },
    { icon: FileText, titleKey: 'tutorial.slide3Title', bodyKey: 'tutorial.slide3Body' },
    { icon: Search, titleKey: 'tutorial.slide4Title', bodyKey: 'tutorial.slide4Body' },
    { icon: Bot, titleKey: 'tutorial.slide5Title', bodyKey: 'tutorial.slide5Body' },
  ]

  const current = slides[step]
  const Icon = current?.icon ?? User

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={<span className="text-lg font-semibold">{t('tutorial.welcome')}</span>}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleSkip} className="text-[var(--color-text-muted)]">
              {t('common:skip', 'Skip')}
            </Button>
            <Button variant="ghost" onClick={handleBack} disabled={step === 0}>
              <ChevronLeft className="h-4 w-4" /> {t('common:back')}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: slideCount }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === step ? 'bg-primary-accent' : 'bg-[var(--color-border)]'
                }`}
                aria-hidden
              />
            ))}
          </div>
          <Button onClick={handleNext}>
            {step === slideCount - 1 ? t('tutorial.getStarted') : t('common:next')}
            {step < slideCount - 1 && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      }
    >
      <div className="py-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-accent/20 text-primary-accent shrink-0">
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--color-text)]">{t(current.titleKey)}</h3>
        </div>
        <div className="text-sm text-[var(--color-text-muted)] whitespace-pre-line leading-relaxed">
          {t(current.bodyKey)}
        </div>
      </div>
    </Modal>
  )
}
