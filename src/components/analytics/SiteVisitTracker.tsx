import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { trackSiteVisit } from '@/services/public'

export function SiteVisitTracker() {
  const location = useLocation()
  const lastTrackedPathRef = useRef('')

  useEffect(() => {
    const path = location.pathname || '/'
    if (lastTrackedPathRef.current === path) return
    lastTrackedPathRef.current = path
    trackSiteVisit(path).catch(() => {
      // Analytics should never interrupt navigation.
    })
  }, [location.pathname])

  return null
}
