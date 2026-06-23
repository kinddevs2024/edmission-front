import { useTranslation } from 'react-i18next'
import type { SearchResult, SearchChatMessageItem, SearchUserItem } from '@/services/search'
import { cn } from '@/utils/cn'

interface SearchResultsListProps {
  /** Для ключей с namespace: `student:navHome`, `common:chat` */
  translate: (key: string) => string
  loading: boolean
  debounced: string
  hasResults: boolean
  isEmpty: boolean
  sitePages: Array<{ path: string; labelKey: string }>
  result: SearchResult | null
  chatMessages: SearchChatMessageItem[]
  onSelectPage: (path: string) => void
  onSelectUniversity: (id: string) => void
  onSelectStudent: (id: string) => void
  onSelectUser: (user: SearchUserItem) => void
  onSelectChatMessage: (chatId: string) => void
  onSearchWithAI: () => void
  variant?: 'dropdown' | 'page'
}

export function SearchResultsList({
  translate,
  loading,
  debounced,
  hasResults,
  isEmpty,
  sitePages,
  result,
  chatMessages,
  onSelectPage,
  onSelectUniversity,
  onSelectStudent,
  onSelectUser,
  onSelectChatMessage,
  onSearchWithAI,
  variant = 'dropdown',
}: SearchResultsListProps) {
  const { t } = useTranslation('common')
  const rowPy = variant === 'dropdown' ? 'py-2' : 'py-3'
  const sectionHeadPy = variant === 'dropdown' ? 'py-1' : 'py-2'

  if (!debounced.trim()) {
    return (
      <p
        className={cn(
          'text-sm text-[var(--color-text-muted)] px-4 py-8 text-center',
          variant === 'page' && 'px-4'
        )}
      >
        {t('searchHint')}
      </p>
    )
  }

  if (loading) {
    return (
      <div className={cn('px-4 py-10 text-center text-sm text-[var(--color-text-muted)]', variant === 'page' && 'py-16')}>
        {t('searchSearching')}
      </div>
    )
  }

  if (hasResults && result) {
    return (
      <div className={cn(variant === 'dropdown' && 'py-1', variant === 'page' && 'pb-8')}>
        {sitePages.length > 0 && (
          <div className="px-2 py-1">
            <p
              className={cn(
                'text-xs font-semibold uppercase tracking-wide text-primary-accent px-3',
                sectionHeadPy
              )}
            >
              {t('search')}
            </p>
            {sitePages.map(({ path, labelKey }) => (
              <button
                key={path}
                type="button"
                onClick={() => onSelectPage(path)}
                className={cn(
                  'w-full text-left px-4 text-sm text-[var(--color-text)] hover:bg-[var(--color-border)]/25 active:bg-[var(--color-border)]/35 rounded-lg flex items-center gap-2 border-b border-[var(--color-border)]/40 last:border-0',
                  rowPy
                )}
              >
                <span className="font-medium">{translate(labelKey)}</span>
              </button>
            ))}
          </div>
        )}
        {result.universities.length > 0 && (
          <div className="px-2 py-1">
            <p
              className={cn(
                'text-xs font-semibold uppercase tracking-wide text-primary-accent px-3',
                sectionHeadPy
              )}
            >
              {t('searchSectionUniversities')}
            </p>
            {result.universities.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => onSelectUniversity(u.id)}
                className={cn(
                  'w-full text-left px-4 text-sm text-[var(--color-text)] hover:bg-[var(--color-border)]/25 rounded-lg flex flex-col gap-0.5 border-b border-[var(--color-border)]/40 last:border-0',
                  rowPy
                )}
              >
                <span className="font-medium">{u.name}</span>
                {(u.country || u.city) && (
                  <span className="text-xs text-[var(--color-text-muted)]">{[u.city, u.country].filter(Boolean).join(', ')}</span>
                )}
              </button>
            ))}
          </div>
        )}
        {result.students.length > 0 && (
          <div className="px-2 py-1">
            <p
              className={cn(
                'text-xs font-semibold uppercase tracking-wide text-primary-accent px-3',
                sectionHeadPy
              )}
            >
              {t('searchSectionStudents')}
            </p>
            {result.students.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectStudent(s.id)}
                className={cn(
                  'w-full text-left px-4 text-sm text-[var(--color-text)] hover:bg-[var(--color-border)]/25 rounded-lg flex flex-col gap-0.5 border-b border-[var(--color-border)]/40 last:border-0',
                  rowPy
                )}
              >
                <span className="font-medium">{[s.firstName, s.lastName].filter(Boolean).join(' ')}</span>
                {(s.country || s.city) && (
                  <span className="text-xs text-[var(--color-text-muted)]">{[s.city, s.country].filter(Boolean).join(', ')}</span>
                )}
              </button>
            ))}
          </div>
        )}
        {result.users && result.users.length > 0 && (
          <div className="px-2 py-1">
            <p
              className={cn(
                'text-xs font-semibold uppercase tracking-wide text-primary-accent px-3',
                sectionHeadPy
              )}
            >
              {t('searchSectionUsers')}
            </p>
            {result.users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => onSelectUser(u)}
                className={cn(
                  'w-full text-left px-4 text-sm text-[var(--color-text)] hover:bg-[var(--color-border)]/25 rounded-lg flex flex-col gap-0.5 border-b border-[var(--color-border)]/40 last:border-0',
                  rowPy
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{u.name || u.email}</span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase bg-primary-accent/15 text-primary-accent px-1.5 py-0.5 rounded">
                    {u.role}
                  </span>
                </div>
                {u.name && (
                  <span className="text-xs text-[var(--color-text-muted)]">{u.email}</span>
                )}
                {u.phone && (
                  <span className="text-xs text-[var(--color-text-muted)]">{u.phone}</span>
                )}
              </button>
            ))}
          </div>
        )}
        {chatMessages.length > 0 && (
          <div className="px-2 py-1">
            <p
              className={cn(
                'text-xs font-semibold uppercase tracking-wide text-primary-accent px-3',
                sectionHeadPy
              )}
            >
              {t('chat')}
            </p>
            {chatMessages.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectChatMessage(m.chatId)}
                className={cn(
                  'w-full text-left px-4 text-sm text-[var(--color-text)] hover:bg-[var(--color-border)]/25 rounded-lg flex flex-col border-b border-[var(--color-border)]/40 last:border-0',
                  rowPy
                )}
              >
                <span className="font-medium truncate">{m.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="px-4 py-8 space-y-4">
        <p className="text-sm text-[var(--color-text-muted)] text-center">{t('searchNoResults')}</p>
        <button
          type="button"
          onClick={onSearchWithAI}
          className="w-full rounded-full bg-primary-accent py-3 text-sm font-semibold text-primary-dark shadow-md hover:bg-primary-accent/90 transition-colors"
        >
          {t('askConsultant', 'Ask consultant')}
        </button>
      </div>
    )
  }

  return null
}
