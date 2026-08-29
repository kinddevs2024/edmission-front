import { Trophy } from 'lucide-react'
import type { StudentRankingRow } from '@/services/student'
import { getStudentLevelDefinition } from '@/config/studentLevels'
import { getStudentAvatarUrl } from '@/services/upload'
import { cn } from '@/utils/cn'

interface RankingTriggerProps {
  rows: StudentRankingRow[]
  onClick: () => void
  className?: string
}

export function RankingTrigger({ rows, onClick, className }: RankingTriggerProps) {
  const preview = rows.slice(0, 3)
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('group inline-flex min-h-[48px] items-center rounded-full border border-white/80 bg-white/88 px-2.5 py-1.5 shadow-[0_15px_35px_-24px_rgba(19,34,56,0.65)] backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary-accent/40 hover:shadow-[0_18px_38px_-22px_rgba(19,34,56,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent dark:border-white/10 dark:bg-slate-900/80', className)}
      aria-label="Open student ranking"
    >
      <span className="flex -space-x-2" aria-hidden>
        {preview.length > 0 ? preview.map((row) => {
          const level = getStudentLevelDefinition(row.level)
          const LevelIcon = level.icon
          return (
            <span key={row.id} className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-100 dark:border-slate-900 dark:bg-slate-800">
              {row.avatarUrl ? (
                <img src={getStudentAvatarUrl(row.avatarUrl)} alt="" className="h-full w-full object-cover" />
              ) : (
                <LevelIcon className={cn('h-4 w-4', level.iconClassName)} />
              )}
            </span>
          )
        }) : (
          [0, 1, 2].map((index) => (
            <span key={index} className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-100 dark:border-slate-900 dark:bg-slate-800">
              <img src="/default-student-avatar.svg" alt="" className="h-full w-full object-cover" />
            </span>
          ))
        )}
      </span>
      <span className="ml-2 hidden text-left sm:block">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Community</span>
        <span className="block text-xs font-semibold text-[var(--color-text)]">Student Ranking</span>
      </span>
      <span className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary-accent/14 text-primary-accent transition-transform group-hover:scale-105">
        <Trophy className="h-4.5 w-4.5" aria-hidden />
      </span>
    </button>
  )
}
