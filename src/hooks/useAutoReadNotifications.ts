import { useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { getNotifications, markNotificationRead, buildNotificationLink } from '@/services/notifications'
import { useNotificationStore, type NotificationItem } from '@/store/notificationStore'
import type { Role } from '@/types/user'

function normalizePath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
}

function getLinkParts(link: string): { pathname: string; searchParams: URLSearchParams } | null {
  try {
    const url = new URL(link, 'http://local.edmission')
    return {
      pathname: normalizePath(url.pathname),
      searchParams: url.searchParams,
    }
  } catch {
    return null
  }
}

function matchesCurrentLocation(notification: NotificationItem, role: Role | null, pathname: string, searchParams: URLSearchParams): boolean {
  const link = notification.link ?? buildNotificationLink(notification.type, notification.referenceId, notification.metadata, role)
  if (!link) return false

  const parts = getLinkParts(link)
  if (!parts) return false
  if (parts.pathname !== pathname) return false

  const requiredKeys = ['chatId', 'documentId']
  for (const key of requiredKeys) {
    const expected = parts.searchParams.get(key)
    if (!expected) continue
    if (searchParams.get(key) !== expected) return false
  }

  return true
}

export function useAutoReadNotifications(role: Role | null, enabled: boolean) {
  const location = useLocation()
  const markManyAsRead = useNotificationStore((s) => s.markManyAsRead)
  const inFlightKeyRef = useRef<string>('')

  const normalizedPath = useMemo(() => normalizePath(location.pathname), [location.pathname])
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])

  useEffect(() => {
    if (!enabled || !role) return
    if (normalizedPath === '/notifications') return

    const routeKey = `${role}:${normalizedPath}:${location.search}`
    if (inFlightKeyRef.current === routeKey) return
    inFlightKeyRef.current = routeKey

    let cancelled = false

    getNotifications({ unread: true, limit: 100 }, role)
      .then(async (response) => {
        if (cancelled) return

        const toRead = response.data.filter((notification) =>
          matchesCurrentLocation(notification, role, normalizedPath, searchParams)
        )
        if (toRead.length === 0) return

        await Promise.all(toRead.map((notification) => markNotificationRead(notification.id).catch(() => undefined)))
        if (cancelled) return
        markManyAsRead(toRead.map((notification) => notification.id))
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
      if (inFlightKeyRef.current === routeKey) {
        inFlightKeyRef.current = ''
      }
    }
  }, [enabled, role, normalizedPath, location.search, searchParams, markManyAsRead])
}
