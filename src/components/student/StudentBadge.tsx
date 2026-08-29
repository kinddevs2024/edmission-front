import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { getStudentLevelDefinition, type StudentLevelId } from '@/config/studentLevels'

interface StudentBadgeProps {
  level: StudentLevelId
  progressPercent?: number
  nextLevel?: StudentLevelId | null
  nextMilestone?: string
  compact?: boolean
  className?: string
}
export function StudentBadge({
  level,
  progressPercent = 0,
  nextLevel,
  nextMilestone,
  compact = false,
  className,
}: StudentBadgeProps) {
  const current = getStudentLevelDefinition(level)
  const next = nextLevel ? getStudentLevelDefinition(nextLevel) : null
  const Icon = current.icon

  return (
    <section className={cn('rounded-[24px] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)]', compact ? 'p-3.5' : 'p-5', className)}>
      <div className="flex items-center gap-3">
        <span className={cn('flex shrink-0 items-center justify-center rounded-2xl', compact ? 'h-11 w-11' : 'h-14 w-14', current.iconClassName)}>
          <Icon className={compact ? 'h-5 w-5' : 'h-7 w-7'} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Current level</p>
          <div className="mt-1 flex items-center gap-2">
            <p className={cn('font-semibold text-[var(--color-text)]', compact ? 'text-base' : 'text-xl')}>{current.label}</p>
            <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold', current.badgeClassName)}>Student</span>
          </div>
        </div>
      </div>

      {!compact ? (
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-[var(--color-text-muted)]">
              {next ? `Progress to ${next.label}` : 'Top level unlocked'}
            </span>
            <span className="font-semibold text-[var(--color-text)]">{Math.round(progressPercent)}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-border)]/70">
            <div
              className={cn('h-full rounded-full transition-[width] duration-700 ease-out', current.progressClassName)}
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
          {nextMilestone ? (
            <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
              <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-primary-accent" aria-hidden />
              {nextMilestone}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
