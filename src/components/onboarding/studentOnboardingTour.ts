import { driver, type Driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import '@/styles/driver-onboarding.css'

export type TourT = (key: string, fallback?: string) => string

const TOUR_STEP_COUNT = 5

/** Build steps for the student onboarding tour (element highlights + blur/dim overlay). */
export function getStudentOnboardingSteps(t: TourT): DriveStep[] {
  return [
    {
      element: '[data-onboarding="dashboard-welcome"]',
      popover: {
        title: `1 / ${TOUR_STEP_COUNT}. ${t('tutorial.slide1Title')}`,
        description: t('tutorial.slide1Body'),
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-onboarding="nav-dashboard"]',
      popover: {
        title: `2 / ${TOUR_STEP_COUNT}. ${t('tutorial.slide2Title')}`,
        description: t('tutorial.slide2Body'),
        side: 'right',
        align: 'center',
      },
    },
    {
      element: '[data-onboarding="nav-profile"]',
      popover: {
        title: `3 / ${TOUR_STEP_COUNT}. ${t('tutorial.slide1Title')}`,
        description: t('tutorial.slide1Body'),
        side: 'right',
        align: 'center',
      },
    },
    {
      element: '[data-onboarding="nav-universities"]',
      popover: {
        title: `4 / ${TOUR_STEP_COUNT}. ${t('tutorial.slide4Title')}`,
        description: t('tutorial.slide4Body'),
        side: 'right',
        align: 'center',
      },
    },
    {
      element: '[data-onboarding="nav-ai"]',
      popover: {
        title: `5 / ${TOUR_STEP_COUNT}. ${t('tutorial.slide5Title')}`,
        description: t('tutorial.slide5Body'),
        side: 'right',
        align: 'center',
      },
    },
  ]
}

/** Run the student onboarding tour. Calls onComplete when the tour is closed or finished. */
export function runStudentOnboardingTour(t: TourT, onComplete: () => void): Driver {
  const steps = getStudentOnboardingSteps(t)
  const nextT = t('common:next', 'Next')
  const prevT = t('common:back', 'Back')
  const doneT = t('tutorial.getStarted', 'Get started')
  const driverObj = driver({
    showProgress: true,
    overlayOpacity: 0.75,
    overlayColor: '#0f172a', /* --color-primary-dark, matches site */
    allowClose: true,
    disableActiveInteraction: true, /* prevent clicking highlighted link — only use tour buttons */
    steps,
    nextBtnText: nextT,
    prevBtnText: prevT,
    doneBtnText: doneT,
    progressText: '{{current}} / {{total}}',
    onPopoverRender(popover, { state }) {
      /* Prevent duplicate label text: set single textContent from our strings */
      const isLast = state.activeIndex != null && state.activeIndex === steps.length - 1
      if (popover.nextButton) {
        popover.nextButton.textContent = isLast ? doneT : nextT
      }
      if (popover.previousButton) {
        popover.previousButton.textContent = prevT
      }
    },
    onDestroyed: () => {
      onComplete()
    },
  })
  driverObj.drive()
  return driverObj
}
