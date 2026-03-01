import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { checkBackendHealth } from '@/services/health'

type Status = 'checking' | 'ok' | 'error'

export function BackendStatus({ className }: { className?: string }) {
  const { t } = useTranslation('common')
  const [status, setStatus] = useState<Status>('checking')
  const [detail, setDetail] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    setStatus('checking')
    setDetail('')
    checkBackendHealth().then((res) => {
      if (cancelled) return
      if (res.ok) {
        setStatus('ok')
        setDetail(res.data?.timestamp ?? '')
      } else {
        setStatus('error')
        setDetail(res.error ?? '')
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'checking') {
    return (
      <p className={`text-sm text-[var(--color-text-muted)] ${className ?? ''}`}>
        {t('backendChecking')}
      </p>
    )
  }
  if (status === 'ok') {
    return (
      <p className={`text-sm text-green-600 dark:text-green-400 ${className ?? ''}`} role="status">
        {t('backendOk')} {detail ? `(${new Date(detail).toLocaleString()})` : ''}
      </p>
    )
  }
  return (
    <p className={`text-sm text-amber-600 dark:text-amber-400 ${className ?? ''}`} role="status">
      {detail || t('backendError')}
    </p>
  )
}
