import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { search, type SearchResult } from '@/services/search'
import { searchSitePages } from '@/constants/sitePages'
import { cn } from '@/utils/cn'

const DEBOUNCE_MS = 300

interface GlobalSearchProps {
  /** Mobile full-width variant */
  variant?: 'default' | 'mobile'
  /** Called when a result is selected (for mobile close) */
  onClose?: () => void
}

export function GlobalSearch({ variant = 'default', onClose }: GlobalSearchProps) {
  const { t } = useTranslation(['common', 'student', 'university'])
  const { user } = useAuth()
  const role = (user as { role?: string })?.role ?? 'student'
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [debounced, setDebounced] = useState('')
  const [result, setResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [value])

  const runSearch = useCallback(async () => {
    if (!debounced.trim()) {
      setResult(null)
      return
    }
    setLoading(true)
    try {
      const data = await search(debounced)
      setResult(data)
    } catch {
      setResult({ universities: [], students: [] })
    } finally {
      setLoading(false)
    }
  }, [debounced])

  useEffect(() => {
    if (!debounced.trim()) {
      setResult(null)
      return
    }
    runSearch()
  }, [debounced, runSearch])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectUniversity = (id: string) => {
    setOpen(false)
    setValue('')
    setResult(null)
    onClose?.()
    navigate(`/student/universities/${id}`)
  }

  const handleSelectStudent = (id: string) => {
    setOpen(false)
    setValue('')
    setResult(null)
    onClose?.()
    if (role === 'university') navigate(`/university/students/${id}/profile`)
    else if (role === 'admin') navigate(`/admin/users`)
    else if (role === 'school_counsellor') navigate(`/school/students/${id}/profile`)
  }

  const handleSelectPage = (path: string) => {
    setOpen(false)
    setValue('')
    setResult(null)
    onClose?.()
    navigate(path)
  }

  const handleSelectChatMessage = (chatId: string) => {
    setOpen(false)
    setValue('')
    setResult(null)
    onClose?.()
    const chatPath = role === 'student' ? '/student/chat' : '/university/chat'
    navigate(`${chatPath}?chat=${chatId}`)
  }

  const handleSearchWithAI = () => {
    setOpen(false)
    onClose?.()
    const q = value.trim()
    setValue('')
    setResult(null)
    navigate(q ? `/ai?q=${encodeURIComponent(q)}` : '/ai')
  }

  const sitePages = useMemo(() => searchSitePages(debounced, role), [debounced, role])
  const chatMessages = result?.chatMessages ?? []
  const hasResults =
    result &&
    (result.universities.length > 0 ||
      result.students.length > 0 ||
      chatMessages.length > 0 ||
      sitePages.length > 0)
  const isEmpty =
    result &&
    result.universities.length === 0 &&
    result.students.length === 0 &&
    chatMessages.length === 0 &&
    sitePages.length === 0
  const showDropdown = open && (loading || result)

  return (
    <div className={cn('relative w-full', variant === 'mobile' ? 'max-w-none' : 'max-w-[220px]')} ref={ref}>
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
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={t('common:searchPlaceholder', 'Search...')}
          className="flex-1 min-w-0 bg-transparent text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none"
          aria-label="Global search"
        />
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1 rounded-card border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg py-1 z-50 animate-modal-enter max-h-[320px] overflow-y-auto">
          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">{t('common:searchSearching', 'Searching...')}</div>
          ) : hasResults ? (
            <>
              {sitePages.length > 0 && (
                <div className="px-2 py-1">
                  <p className="text-xs font-medium text-[var(--color-text-muted)] px-2 py-1">{t('common:search', 'Search')}</p>
                  {sitePages.map(({ path, labelKey }) => (
                    <button
                      key={path}
                      type="button"
                      onClick={() => handleSelectPage(path)}
                      className="w-full text-left px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-border)]/20 rounded-input flex items-center gap-2"
                    >
                      <span className="font-medium">{t(labelKey)}</span>
                    </button>
                  ))}
                </div>
              )}
              {result!.universities.length > 0 && (
                <div className="px-2 py-1">
                  <p className="text-xs font-medium text-[var(--color-text-muted)] px-2 py-1">Universities</p>
                  {result!.universities.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectUniversity(u.id)}
                      className="w-full text-left px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-border)]/20 rounded-input flex flex-col"
                    >
                      <span className="font-medium">{u.name}</span>
                      {(u.country || u.city) && (
                        <span className="text-xs text-[var(--color-text-muted)]">{[u.city, u.country].filter(Boolean).join(', ')}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {result!.students.length > 0 && (
                <div className="px-2 py-1">
                  <p className="text-xs font-medium text-[var(--color-text-muted)] px-2 py-1">Students</p>
                  {result!.students.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectStudent(s.id)}
                      className="w-full text-left px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-border)]/20 rounded-input flex flex-col"
                    >
                      <span className="font-medium">{[s.firstName, s.lastName].filter(Boolean).join(' ')}</span>
                      {(s.country || s.city) && (
                        <span className="text-xs text-[var(--color-text-muted)]">{[s.city, s.country].filter(Boolean).join(', ')}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {chatMessages.length > 0 && (
                <div className="px-2 py-1">
                  <p className="text-xs font-medium text-[var(--color-text-muted)] px-2 py-1">{t('common:chat', 'Chat')}</p>
                  {chatMessages.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectChatMessage(m.chatId)}
                      className="w-full text-left px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-border)]/20 rounded-input flex flex-col"
                    >
                      <span className="font-medium truncate">{m.text}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : isEmpty ? (
            <div className="px-4 py-4 space-y-2">
              <p className="text-sm text-[var(--color-text-muted)]">{t('common:searchNoResults', 'No results found.')}</p>
              <button
                type="button"
                onClick={handleSearchWithAI}
                className="w-full text-sm font-medium text-primary-accent hover:underline"
              >
                {t('common:searchWithAI', 'Search with AI instead')}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
