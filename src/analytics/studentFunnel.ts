/**
 * Lightweight funnel events for UX iteration (time-to-first-recommendation, onboarding).
 * In production, forward to your analytics backend or dataLayer from here.
 */
export type StudentFunnelEvent =
  | 'student_home_view'
  | 'student_home_primary_cta'
  | 'student_first_recommendations_shown'
  | 'student_macro_onboarding_complete'
  | 'student_macro_onboarding_skip'
  | 'student_profile_meter_click'

declare global {
  interface Window {
    __edmissionFunnel?: Array<{ event: string; props?: Record<string, unknown>; ts: number }>
    dataLayer?: unknown[]
  }
}

export function trackStudentFunnel(event: StudentFunnelEvent, props?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  const row = { event, props, ts: Date.now() }
  window.__edmissionFunnel = window.__edmissionFunnel ?? []
  window.__edmissionFunnel.push(row)
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[edmission funnel]', event, props)
  }
  try {
    window.dataLayer = window.dataLayer ?? []
    window.dataLayer.push({ event, ...props })
  } catch {
    /* optional GTM */
  }
}
