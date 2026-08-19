import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { checkBackendHealth } from '@/services/health'
import { StatusPulseText } from '@/components/ui/TextMotion'

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
        <StatusPulseText label={t('backendChecking')} status="checking" />
      </p>
    )
  }
  if (status === 'ok') {
    return (
      <p className={`text-sm text-green-600 dark:text-green-400 ${className ?? ''}`} role="status">
        <StatusPulseText
          label={`${t('backendOk')}${detail ? ` (${new Date(detail).toLocaleString()})` : ''}`}
          status="ok"
        />
      </p>
    )
  }
  return (
    <p className={`text-sm text-amber-600 dark:text-amber-400 ${className ?? ''}`} role="status">
      <StatusPulseText label={detail || t('backendError')} status="error" />
    </p>
  )
}
