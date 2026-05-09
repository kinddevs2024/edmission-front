import { driver, type Driver } from 'driver.js'
import type { NavigateFunction } from 'react-router-dom'
import 'driver.js/dist/driver.css'
import '@/styles/driver-onboarding.css'

export type OnboardingRole = 'student' | 'university'
export type TourT = (key: string, fallback?: string) => string

type StepSide = 'left' | 'right' | 'top' | 'bottom' | 'over'
type StepAlign = 'start' | 'center' | 'end'
type StepTarget = string | (() => Element | null)

interface RouteAwareTourStep {
  route: string
  target: StepTarget
  title: string
  description: string
  side?: StepSide
  align?: StepAlign
  interactive?: boolean
  advanceOnPathname?: string
}

interface ActiveTourSession {
  id: number
  role: OnboardingRole
  pathname: string
  currentIndex: number
  steps: RouteAwareTourStep[]
  navigate: NavigateFunction
  onComplete: () => void
  nextLabel: string
  prevLabel: string
  doneLabel: string
  driverObj: Driver | null
  destroyMode: 'rerender' | 'complete' | 'dispose' | null
  renderRequestId: number
}

interface StartRoleOnboardingTourOptions {
  role: OnboardingRole
  pathname: string
  navigate: NavigateFunction
  t: TourT
  onComplete: () => void
}

let activeSession: ActiveTourSession | null = null
let nextSessionId = 1

const OVERLAY_COLOR = '#0f172a'
const WAIT_TIMEOUT_MS = 4000
const WAIT_INTERVAL_MS = 100

function isVisibleElement(node: Element | null): node is HTMLElement {
  if (!(node instanceof HTMLElement)) return false
  const rect = node.getBoundingClientRect()
  const style = window.getComputedStyle(node)
  return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
}

function resolveTarget(target: StepTarget): Element | null {
  if (typeof target === 'function') return target()

  const nodes = Array.from(document.querySelectorAll(target))
  return nodes.find((node) => isVisibleElement(node)) ?? null
}

function waitForTarget(target: StepTarget, timeoutMs = WAIT_TIMEOUT_MS): Promise<Element> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now()

    const attempt = () => {
      const node = resolveTarget(target)
      if (node) {
        resolve(node)
        return
      }

      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error('Onboarding target not found'))
        return
      }

      window.setTimeout(attempt, WAIT_INTERVAL_MS)
    }

    attempt()
  })
}

function setButtonText(button: HTMLButtonElement | null | undefined, text: string) {
  if (!button) return
  button.replaceChildren(document.createTextNode(text))
  button.setAttribute('aria-label', text)
}

function destroyCurrentDriver(mode: ActiveTourSession['destroyMode']) {
  if (!activeSession?.driverObj) return

  activeSession.destroyMode = mode
  activeSession.driverObj.destroy()
  activeSession.driverObj = null
  activeSession.destroyMode = null
}

function finishActiveTour() {
  const session = activeSession
  if (!session) return

  destroyCurrentDriver('complete')
  activeSession = null
  session.onComplete()
}

function disposeActiveTour() {
  if (!activeSession) return

  destroyCurrentDriver('dispose')
  activeSession = null
}

function goToStep(nextIndex: number) {
  const session = activeSession
  if (!session) return

  if (nextIndex < 0) return
  if (nextIndex >= session.steps.length) {
    finishActiveTour()
    return
  }

  session.currentIndex = nextIndex
  const nextStep = session.steps[nextIndex]

  if (session.pathname !== nextStep.route) {
    destroyCurrentDriver('rerender')
    session.navigate(nextStep.route)
    return
  }

  void renderActiveStep()
}

async function renderActiveStep() {
  const session = activeSession
  if (!session) return

  const step = session.steps[session.currentIndex]
  if (session.pathname !== step.route) return

  session.renderRequestId += 1
  const renderRequestId = session.renderRequestId
  const sessionId = session.id
  const stepIndex = session.currentIndex

  try {
    const target = await waitForTarget(step.target)
    const liveSession = activeSession

    if (
      !liveSession ||
      liveSession.id !== sessionId ||
      liveSession.renderRequestId !== renderRequestId ||
      liveSession.currentIndex !== stepIndex
    ) {
      return
    }

    destroyCurrentDriver('rerender')

    const totalSteps = liveSession.steps.length
    const isLastStep = stepIndex === totalSteps - 1
    const nextLabel = isLastStep ? liveSession.doneLabel : liveSession.nextLabel

    const driverObj = driver({
      showProgress: false,
      allowClose: true,
      overlayOpacity: 0.75,
      overlayColor: OVERLAY_COLOR,
      disableActiveInteraction: !step.interactive,
      nextBtnText: nextLabel,
      prevBtnText: liveSession.prevLabel,
      doneBtnText: liveSession.doneLabel,
      onDestroyed: () => {
        const current = activeSession
        if (!current || current.id !== sessionId) return
        if (current.destroyMode) return
        finishActiveTour()
      },
      onPopoverRender(popover) {
        setButtonText(popover.previousButton, liveSession.prevLabel)
        setButtonText(popover.nextButton, nextLabel)
      },
    })

    liveSession.driverObj = driverObj

    driverObj.highlight({
      element: target,
      disableActiveInteraction: !step.interactive,
      popover: {
        title: `${stepIndex + 1} / ${totalSteps}. ${step.title}`,
        description: step.description,
        side: step.side ?? 'bottom',
        align: step.align ?? 'start',
        showButtons: ['previous', 'next', 'close'],
        disableButtons: stepIndex === 0 ? ['previous'] : [],
        nextBtnText: nextLabel,
        prevBtnText: liveSession.prevLabel,
        onNextClick: () => goToStep(stepIndex + 1),
        onPrevClick: () => goToStep(stepIndex - 1),
        onCloseClick: () => finishActiveTour(),
      },
    })
  } catch {
    /* If the page is still loading or the element is unavailable, we silently wait for the next route sync. */
  }
}

function getStudentTourSteps(t: TourT): RouteAwareTourStep[] {
  return [
    {
      route: '/student/dashboard',
      target: '[data-onboarding="student-home-mission"]',
      title: t('tourStep1Title', 'Start here'),
      description: t(
        'tourStep1Body',
        'This is your home: one main action (explore or improve your profile) and your progress at a glance.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      route: '/student/dashboard',
      target: '[data-onboarding="dashboard-get-started"]',
      title: t('tourStep2Title', 'Your required checklist'),
      description: t(
        'tourStep2Body',
        'A complete profile unlocks better matches. Tap the meter anytime to continue where you left off.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      route: '/student/dashboard',
      target: '[data-onboarding="nav-profile"]',
      title: t('tourStep3Title', 'Open your profile'),
      description: t(
        'tourStep3Body',
        'Follow these steps once — then use Home and Explore for everything else. You can replay the intro from here.'
      ),
      side: 'right',
      align: 'center',
      interactive: true,
      advanceOnPathname: '/student/profile',
    },
    {
      route: '/student/profile',
      target: '[data-onboarding="student-profile-overview"]',
      title: t('tourProfileOverviewTitle', 'Student profile'),
      description: t(
        'tourProfileOverviewBody',
        'Fill the core sections first. Optional portfolio details can wait until later.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      route: '/student/profile?profileSection=personal',
      target: '[data-onboarding="student-profile-personal-fields"]',
      title: t('tourPersonalTitle', 'Personal details'),
      description: t('tourPersonalBody', 'Add your name and date of birth so universities can identify your application correctly.'),
      side: 'bottom',
      align: 'start',
      interactive: true,
    },
    {
      route: '/student/profile?profileSection=location',
      target: '[data-onboarding="student-profile-location-fields"]',
      title: t('tourLocationTitle', 'Current and target countries'),
      description: t(
        'tourLocationBody',
        'Tell us where you live now and which countries you want to study in. This controls country-based matches.'
      ),
      side: 'bottom',
      align: 'start',
      interactive: true,
    },
    {
      route: '/student/profile?profileSection=faculties',
      target: '[data-onboarding="student-profile-faculty-fields"]',
      title: t('tourFacultyTitle', 'Faculty or study direction'),
      description: t(
        'tourFacultyBody',
        'Choose the faculties or fields you are interested in. This is one of the strongest matching signals.'
      ),
      side: 'bottom',
      align: 'start',
      interactive: true,
    },
    {
      route: '/student/profile?profileSection=about',
      target: '[data-onboarding="student-profile-budget-fields"]',
      title: t('tourBudgetTitle', 'Study budget'),
      description: t(
        'tourBudgetBody',
        'Add your budget so Edmission can avoid universities that do not fit your financial range.'
      ),
      side: 'bottom',
      align: 'start',
      interactive: true,
    },
    {
      route: '/student/documents',
      target: '[data-onboarding="student-documents-category"]',
      title: t('tourDocumentsTitle', 'Document category'),
      description: t(
        'tourDocumentsBody',
        'Pick the document type first: passport, transcript, diploma, language certificate, or another file.'
      ),
      side: 'bottom',
      align: 'start',
      interactive: true,
    },
    {
      route: '/student/documents',
      target: '[data-onboarding="student-documents-upload"]',
      title: t('tourUploadTitle', 'Upload the file'),
      description: t(
        'tourUploadBody',
        'Upload the document image or PDF, then submit it for review. You can add more documents later.'
      ),
      side: 'top',
      align: 'start',
      interactive: true,
    },
  ]
}

function getUniversityTourSteps(t: TourT): RouteAwareTourStep[] {
  return [
    {
      route: '/university/dashboard',
      target: '[data-onboarding="university-dashboard-overview"]',
      title: t('tutorial.slide2Title', 'Dashboard'),
      description: t('tutorial.slide2Body', 'The dashboard shows interests, chats, offers, and performance.'),
      side: 'bottom',
      align: 'start',
    },
    {
      route: '/university/dashboard',
      target: '[data-onboarding="nav-profile"]',
      title: t('tutorial.slide1Title', 'University profile'),
      description: t('tutorial.slide1Body', 'Keep the profile complete so students clearly understand your university.'),
      side: 'right',
      align: 'center',
      interactive: true,
      advanceOnPathname: '/university/profile',
    },
    {
      route: '/university/profile',
      target: '[data-onboarding="university-profile-overview"]',
      title: t('tutorial.slide1Title', 'University profile'),
      description: t('tutorial.slide1Body', 'Add your description, location, requirements, tuition, and faculties here.'),
      side: 'bottom',
      align: 'start',
    },
    {
      route: '/university/profile',
      target: '[data-onboarding="nav-students"]',
      title: t('university:navDiscovery', 'Discovery'),
      description: t('tutorial.slide3Body', 'Open Discovery to review students who match your profile and filters.'),
      side: 'right',
      align: 'center',
      interactive: true,
      advanceOnPathname: '/university/students',
    },
    {
      route: '/university/students',
      target: '[data-onboarding="university-discovery-overview"]',
      title: t('university:navDiscovery', 'Discovery'),
      description: t('tutorial.slide3Body', 'This page helps you find students, review matches, and open contact.'),
      side: 'bottom',
      align: 'start',
    },
    {
      route: '/university/students',
      target: '[data-onboarding="nav-pipeline"]',
      title: t('university:navPipeline', 'Pipeline'),
      description: t('tutorial.slide3Body', 'Use the pipeline to move students from interest to offer and admission.'),
      side: 'right',
      align: 'center',
      interactive: true,
      advanceOnPathname: '/university/pipeline',
    },
    {
      route: '/university/pipeline',
      target: '[data-onboarding="university-pipeline-overview"]',
      title: t('university:navPipeline', 'Pipeline'),
      description: t('tutorial.slide3Body', 'Track students by stage, update statuses, and send offers from here.'),
      side: 'bottom',
      align: 'start',
    },
    {
      route: '/university/pipeline',
      target: '[data-onboarding="floating-ai"]',
      title: t('tutorial.slide5Title', 'Edmission AI'),
      description: t('tutorial.slide5Body', 'AI is available here too when you need help with filters, profiles, or platform questions.'),
      side: 'left',
      align: 'end',
      interactive: true,
    },
  ]
}

function buildSteps(role: OnboardingRole, t: TourT): RouteAwareTourStep[] {
  return role === 'student' ? getStudentTourSteps(t) : getUniversityTourSteps(t)
}

export function startRoleOnboardingTour({ role, pathname, navigate, t, onComplete }: StartRoleOnboardingTourOptions) {
  if (activeSession?.role === role) return
  if (activeSession) disposeActiveTour()

  const steps = buildSteps(role, t)
  const firstStepIndex = Math.max(0, steps.findIndex((step) => step.route === pathname))

  activeSession = {
    id: nextSessionId++,
    role,
    pathname,
    currentIndex: firstStepIndex >= 0 ? firstStepIndex : 0,
    steps,
    navigate,
    onComplete,
    nextLabel: t('common:next', 'Next'),
    prevLabel: t('common:back', 'Back'),
    doneLabel: t('tutorial.getStarted', 'Done'),
    driverObj: null,
    destroyMode: null,
    renderRequestId: 0,
  }

  const currentStep = activeSession.steps[activeSession.currentIndex]
  if (currentStep.route !== pathname) {
    navigate(currentStep.route)
    return
  }

  void renderActiveStep()
}

export function syncRoleOnboardingTour(role: OnboardingRole, pathname: string) {
  const session = activeSession
  if (!session || session.role !== role) return

  session.pathname = pathname
  const currentStep = session.steps[session.currentIndex]

  if (currentStep.advanceOnPathname === pathname) {
    session.currentIndex = Math.min(session.currentIndex + 1, session.steps.length - 1)
  }

  if (session.steps[session.currentIndex].route !== pathname) return
  void renderActiveStep()
}

export function isRoleOnboardingTourActive(role: OnboardingRole) {
  return activeSession?.role === role
}

export function disposeRoleOnboardingTour(role: OnboardingRole) {
  if (activeSession?.role !== role) return
  disposeActiveTour()
}
