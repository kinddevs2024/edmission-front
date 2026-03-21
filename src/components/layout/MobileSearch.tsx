import { Search, X } from 'lucide-react'
import { GlobalSearch } from './GlobalSearch'
import { cn } from '@/utils/cn'

interface MobileSearchProps {
  open: boolean
  onOpen: () => void
  onClose: () => void
}

export function MobileSearch({ open, onOpen, onClose }: MobileSearchProps) {

  return (
    <div className={cn('md:hidden flex items-center', open ? 'overflow-visible' : 'overflow-hidden')}>
      {!open ? (
        <button
          type="button"
          onClick={onOpen}
          className="flex items-center justify-center w-10 h-10 rounded-input hover:bg-[var(--color-border)]/30 transition-colors shrink-0"
          aria-label="Open search"
        >
          <Search className="w-5 h-5 text-[var(--color-text-muted)]" aria-hidden />
        </button>
      ) : (
        <div className="flex items-center gap-2 w-full min-w-0 animate-search-expand">
          <div className="flex-1 min-w-0 max-w-full">
            <GlobalSearch variant="mobile" onClose={onClose} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 flex items-center justify-center w-10 h-10 rounded-input hover:bg-[var(--color-border)]/30 transition-colors"
            aria-label="Close search"
          >
            <X className="w-5 h-5 text-[var(--color-text-muted)]" aria-hidden />
          </button>
        </div>
      )}
    </div>
  )
}
