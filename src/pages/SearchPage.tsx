import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Loader2, Search, X } from 'lucide-react'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'
import { SearchResultsList } from '@/components/search/SearchResultsList'
import { useAuth } from '@/hooks/useAuth'
import { getDashboardPath } from '@/utils/dashboardPath'
import { cn } from '@/utils/cn'

export function SearchPage() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const dashboardPath = getDashboardPath(user)
  const seeded = useRef(false)

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
    handleSelectUser,
    handleSelectPage,
    handleSelectChatMessage,
    handleSearchWithAI,
  } = useGlobalSearch()

  useEffect(() => {
    const q = searchParams.get('q')
    if (q != null && q !== '' && !seeded.current) {
      seeded.current = true
      setValue(q)
    }
  }, [searchParams, setValue])

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 100)
    return () => window.clearTimeout(t)
  }, [])

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate(dashboardPath)
  }

  return (
    <div
      className={cn(
        'flex flex-col bg-[var(--color-bg)]',
        'fixed inset-0 z-[50] md:static md:inset-auto md:z-0',
        'md:max-w-3xl md:mx-auto md:w-full md:min-h-[min(70vh,32rem)] md:rounded-card md:border md:border-[var(--color-border)] md:my-4 md:shadow-sm overflow-hidden'
      )}
    >
      <h1 className="sr-only">{t('searchPageTitle', 'Search')}</h1>

      <div
        className={cn(
          'shrink-0 flex items-center gap-2 px-2 sm:px-3 py-3 border-b border-[var(--color-border)]',
          'bg-[var(--color-card)]',
          'pt-[max(0.5rem,env(safe-area-inset-top,0px))] md:pt-3'
        )}
      >
        <button
          type="button"
          onClick={handleBack}
          className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full hover:bg-[var(--color-border)]/35 transition-colors md:rounded-input"
          aria-label={t('back')}
        >
          <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" aria-hidden />
        </button>

        <div
          className={cn(
            'flex flex-1 min-w-0 items-center gap-3 rounded-full px-4 py-2.5',
            'bg-[var(--color-border)]/25 dark:bg-white/[0.07]',
            'border-2 border-transparent',
            'focus-within:border-primary-accent focus-within:shadow-[0_0_0_3px_rgba(132,204,22,0.28)]',
            'transition-shadow duration-200'
          )}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary-accent" aria-hidden />
          ) : (
            <Search className="h-5 w-5 shrink-0 text-primary-accent" aria-hidden />
          )}
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t('searchPlaceholder')}
            enterKeyHint="search"
            className="flex-1 min-w-0 bg-transparent text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none"
            aria-label={t('search')}
          />
          {value ? (
            <button
              type="button"
              onClick={() => reset()}
              className="shrink-0 p-1 rounded-full hover:bg-[var(--color-border)]/40 text-[var(--color-text-muted)]"
              aria-label={t('clear')}
            >
              <X className="w-5 h-5 shrink-0" strokeWidth={2} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          'flex-1 overflow-y-auto overscroll-contain min-h-0',
          'pb-[calc(6.75rem+env(safe-area-inset-bottom,0px))] md:pb-6'
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
          onSelectUser={handleSelectUser}
          onSelectChatMessage={handleSelectChatMessage}
          onSearchWithAI={handleSearchWithAI}
          variant="page"
        />
      </div>
    </div>
  )
}
