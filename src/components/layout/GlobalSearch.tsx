import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Loader2, X } from 'lucide-react'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'
import { SearchResultsList } from '@/components/search/SearchResultsList'
import { cn } from '@/utils/cn'

interface GlobalSearchProps {
  variant?: 'default' | 'mobile'
  onClose?: () => void
}

export function GlobalSearch({ variant = 'default', onClose }: GlobalSearchProps) {
  const { t } = useTranslation(['common', 'student', 'university'])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const {
    value,
    setValue,
    debounced,
    result,
    loading,
    sitePages,
    chatMessages,
    hasResults,
    isEmpty,
    t: searchT,
    reset,
    handleSelectUniversity,
    handleSelectStudent,
    handleSelectPage,
    handleSelectChatMessage,
    handleSearchWithAI,
  } = useGlobalSearch({
    afterNavigate: () => {
      setOpen(false)
      onClose?.()
    },
  })

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const showDropdown = open && (loading || result !== null)

  return (
    <div className={cn('relative w-full', variant === 'mobile' ? 'max-w-none' : 'max-w-[300px] min-w-[200px]')} ref={ref}>
      <div
        className={cn(
          'flex items-center gap-2 rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2',
          'focus-within:ring-2 focus-within:ring-primary-accent/50 focus-within:border-primary-accent'
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--color-text-muted)]" aria-hidden />
        ) : (
          <Search className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" aria-hidden />
        )}
        <input
          type="text"
          inputMode="search"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={t('common:searchPlaceholder', 'Search...')}
          className="flex-1 min-w-0 bg-transparent text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none"
          aria-label={t('common:search', 'Search')}
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              reset()
              setOpen(true)
            }}
            className="shrink-0 p-0.5 rounded-md hover:bg-[var(--color-border)]/40 text-[var(--color-text-muted)]"
            aria-label={t('common:clear', 'Clear')}
          >
            <X className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>

      {showDropdown && (
        <div
          className={cn(
            'absolute left-0 right-0 top-full mt-1 rounded-card border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg z-50 animate-modal-enter overflow-x-hidden overflow-y-auto',
            'max-h-[min(28rem,calc(100dvh-7rem))]'
          )}
        >
          <SearchResultsList
            translate={searchT}
            loading={loading}
            debounced={debounced}
            hasResults={Boolean(hasResults)}
            isEmpty={Boolean(isEmpty)}
            sitePages={sitePages}
            result={result}
            chatMessages={chatMessages}
            onSelectPage={handleSelectPage}
            onSelectUniversity={handleSelectUniversity}
            onSelectStudent={handleSelectStudent}
            onSelectChatMessage={handleSelectChatMessage}
            onSearchWithAI={handleSearchWithAI}
            variant="dropdown"
          />
        </div>
      )}
    </div>
  )
}
