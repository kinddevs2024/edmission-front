import { useEffect, useRef, useState } from 'react'
import { Flag, LocateFixed, Trophy, UsersRound } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { getStudentRanking, type StudentRankingRow, type StudentRankingScope } from '@/services/student'
import { getStudentLevelDefinition } from '@/config/studentLevels'
import { getStudentAvatarUrl } from '@/services/upload'
import { getCountryFlagUrl } from '@/utils/countryFlag'
import { cn } from '@/utils/cn'

interface StudentRankingSheetProps {
  open: boolean
  onClose: () => void
  onLoaded?: (rows: StudentRankingRow[]) => void
}

const FILTERS: { id: StudentRankingScope; label: string }[] = [
  { id: 'global', label: 'Global' },
  { id: 'country', label: 'My country' },
  { id: 'level', label: 'My level' },
]

function RankingRow({ row, currentRef }: { row: StudentRankingRow; currentRef?: React.RefObject<HTMLLIElement> }) {
  const level = getStudentLevelDefinition(row.level)
  const LevelIcon = level.icon
  const flagUrl = getCountryFlagUrl(row.country)
  return (
    <li
      ref={row.isCurrentUser ? currentRef : undefined}
      tabIndex={row.isCurrentUser ? -1 : undefined}
      className={cn('grid grid-cols-[34px_40px_minmax(0,1fr)] items-center gap-x-2 gap-y-1 rounded-[18px] border px-2.5 py-3 transition-colors sm:grid-cols-[42px_44px_minmax(0,1fr)_auto] sm:gap-3 sm:px-3', row.isCurrentUser ? 'border-primary-accent/45 bg-primary-accent/8' : 'border-transparent hover:bg-[var(--color-bg)]')}
    >
      <span className={cn('text-center text-sm font-semibold', row.position <= 3 ? 'text-primary-accent' : 'text-[var(--color-text-muted)]')}>#{row.position}</span>
      <img src={getStudentAvatarUrl(row.avatarUrl)} alt="" className="h-11 w-11 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] object-cover" />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-[var(--color-text)]">{row.fullName}</p>
          {row.isCurrentUser ? <span className="rounded-full bg-primary-accent/14 px-2 py-0.5 text-[10px] font-semibold text-primary-accent">You</span> : null}
        </div>
        <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-[var(--color-text-muted)]">
          {flagUrl ? <img src={flagUrl} alt="" className="h-3.5 w-5 rounded-sm object-cover" /> : <Flag className="h-3.5 w-3.5" aria-hidden />}
          <span className="truncate">{row.country || 'Country not added'}</span>
          <span aria-hidden>·</span>
          <span>{row.offersCount} {row.offersCount === 1 ? 'offer' : 'offers'}</span>
          {row.grantsCount > 0 ? <><span className="hidden sm:inline" aria-hidden>·</span><span className="hidden sm:inline">{row.grantsCount} {row.grantsCount === 1 ? 'grant' : 'grants'}</span></> : null}
        </div>
      </div>
      <span className={cn('col-start-3 row-start-2 flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold sm:col-start-4 sm:row-start-1', level.badgeClassName)}>
        <LevelIcon className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden sm:inline">{level.label}</span>
      </span>
    </li>
  )
}

export function StudentRankingSheet({ open, onClose, onLoaded }: StudentRankingSheetProps) {
  const [scope, setScope] = useState<StudentRankingScope>('global')
  const [rows, setRows] = useState<StudentRankingRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const currentRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError('')
    getStudentRanking(scope)
      .then((response) => {
        if (cancelled) return
        setRows(response.rows)
        onLoaded?.(response.rows)
      })
      .catch(() => {
        if (!cancelled) setError('The ranking is taking a little longer to load. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [onLoaded, open, reloadKey, scope])

  const findMyPosition = () => {
    currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    currentRef.current?.focus?.()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={(
        <div>
          <p className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]"><Trophy className="h-5 w-5 text-primary-accent" aria-hidden /> Student Ranking</p>
          <p className="mt-1 text-xs font-normal text-[var(--color-text-muted)]">Students building stronger academic profiles around the world.</p>
        </div>
      )}
      panelClassName="fixed inset-x-0 bottom-0 max-h-[88vh] max-w-none rounded-b-none rounded-t-[30px] sm:relative sm:inset-auto sm:max-w-2xl sm:rounded-[28px]"
      contentClassName="px-3 pb-2 pt-3 sm:px-4"
      footerClassName="sticky bottom-0 bg-[var(--color-card)]"
      footer={(
        <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={findMyPosition} disabled={!rows.some((row) => row.isCurrentUser)}>
          <LocateFixed className="h-4 w-4" aria-hidden /> Find my position
        </Button>
      )}
    >
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setScope(filter.id)}
            className={cn('min-h-[40px] shrink-0 rounded-full border px-4 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent', scope === filter.id ? 'border-primary-accent bg-primary-accent/12 text-[var(--color-text)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]')}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2" aria-label="Loading ranking">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[70px] animate-pulse rounded-[18px] bg-[var(--color-border)]/55" />)}
        </div>
      ) : error ? (
        <div className="rounded-[20px] border border-amber-500/25 bg-amber-500/8 p-5 text-center">
          <UsersRound className="mx-auto h-6 w-6 text-amber-500" aria-hidden />
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">{error}</p>
          <button type="button" className="mt-3 text-sm font-semibold text-primary-accent hover:underline" onClick={() => setReloadKey((value) => value + 1)}>Try again</button>
        </div>
      ) : rows.length > 0 ? (
        <ol className="space-y-1" aria-label="Student ranking list">
          {rows.map((row) => <RankingRow key={row.id} row={row} currentRef={currentRef} />)}
        </ol>
      ) : (
        <div className="py-10 text-center text-sm text-[var(--color-text-muted)]">No students are visible in this ranking yet.</div>
      )}
    </Modal>
  )
}
