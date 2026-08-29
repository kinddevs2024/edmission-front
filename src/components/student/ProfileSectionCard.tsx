import type { LucideIcon } from 'lucide-react'
import { ArrowRight, CheckCircle2, CircleDashed } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ProfileSectionCardProps {
  icon: LucideIcon
  title: string
  description: string
  percent: number
  onClick: () => void
  className?: string
}
export function ProfileSectionCard({ icon: Icon, title, description, percent, onClick, className }: ProfileSectionCardProps) {
  const complete = percent >= 100
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('group flex min-h-[152px] flex-col rounded-[22px] border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-left shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary-accent/45 hover:shadow-[var(--shadow-card-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', complete ? 'bg-green-500/12 text-green-600 dark:text-green-400' : 'bg-primary-accent/12 text-primary-accent')}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        {complete ? <CheckCircle2 className="h-5 w-5 text-green-500" aria-label="Completed" /> : <CircleDashed className="h-5 w-5 text-[var(--color-text-muted)]" aria-label="In progress" />}
      </div>
      <p className="mt-3 font-semibold text-[var(--color-text)]">{title}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-muted)]">{description}</p>
      <div className="mt-auto pt-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className={complete ? 'font-medium text-green-600 dark:text-green-400' : 'text-[var(--color-text-muted)]'}>{complete ? 'Ready' : 'Strengthen this section'}</span>
          <span className="flex items-center gap-1 font-semibold text-[var(--color-text)]">{percent}% <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]/70">
          <div className={cn('h-full rounded-full transition-[width] duration-500', complete ? 'bg-green-500' : 'bg-primary-accent')} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
        </div>
      </div>
    </button>
  )
}
