import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

/** Мобильная кнопка: открывает полноэкранную страницу поиска. */
export function MobileSearch() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate('/search')}
      className="md:hidden flex items-center justify-center w-10 h-10 rounded-input hover:bg-[var(--color-border)]/30 transition-colors shrink-0"
      aria-label={t('search')}
    >
      <Search className="w-5 h-5 text-[var(--color-text-muted)]" aria-hidden />
    </button>
  )
}
