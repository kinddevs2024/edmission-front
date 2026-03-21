import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'

interface MatchScoreProps {
  score: number
  breakdown?: Record<string, number>
  variant?: 'circle' | 'bar' | 'badge'
  size?: 'sm' | 'md'
  className?: string
}

export function MatchScore({ score, breakdown, variant = 'badge', size = 'md', className }: MatchScoreProps) {
  const { t } = useTranslation('student')
  const clamped = Math.min(100, Math.max(0, Math.round(score)))
  void breakdown

  if (variant === 'circle') {
    const r = size === 'sm' ? 20 : 28
    const circ = 2 * Math.PI * r
    const stroke = (clamped / 100) * circ
    return (
      <div className={cn('relative inline-flex', className)}>
        <svg width={r * 2 + 8} height={r * 2 + 8} className="transform -rotate-90">
          <circle cx={r + 4} cy={r + 4} r={r} fill="none" stroke="var(--color-border)" strokeWidth="4" />
          <circle
            cx={r + 4}
            cy={r + 4}
            r={r}
            fill="none"
            stroke="var(--color-primary-accent, #84CC16)"
            strokeWidth="4"
            strokeDasharray={circ}
            strokeDashoffset={circ - stroke}
            strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-500"
          />
        </svg>
        <span className={cn('absolute inset-0 flex items-center justify-center font-semibold text-primary-accent', size === 'sm' ? 'text-xs' : 'text-sm')}>
          {clamped}%
        </span>
      </div>
    )
  }

  if (variant === 'bar') {
    return (
      <div className={cn('relative', className)}>
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
            <div
              className="h-full rounded-full bg-primary-accent transition-[width] duration-500"
              style={{ width: `${clamped}%` }}
            />
          </div>
          <span className="text-sm font-medium text-primary-accent">{clamped}%</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative inline-flex items-center rounded-full bg-primary-accent/20 text-primary-accent font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className
      )}
    >
      {t('matchLabel', { score: clamped, defaultValue: '{{score}}% match' })}
    </div>
  )
}
