import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Shield } from 'lucide-react'
import { LanguageMenu } from '@/components/layout/LanguageMenu'
import { ThemeSwitch } from '@/components/ui/ThemeSwitch'

export function FooterSection() {
  const { t } = useTranslation('landing')
  const FOOTER_LINKS = [
    { title: t('footer.platform.title'), items: [t('footer.platform.0'), t('footer.platform.1'), t('footer.platform.2')] },
    { title: t('footer.students.title'), items: [t('footer.students.0'), t('footer.students.1'), t('footer.students.2')] },
    { title: t('footer.universities.title'), items: [t('footer.universities.0'), t('footer.universities.1'), t('footer.universities.2')] },
    { title: t('footer.support.title'), items: [t('footer.support.0'), t('footer.support.1'), t('footer.support.2')] },
  ]
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-card)]/70">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <p className="text-xl font-semibold">{t('footer.brand')}</p>
            <p className="mt-2 max-w-sm text-sm text-[var(--color-text-muted)]">
              {t('footer.description')}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <LanguageMenu />
              <ThemeSwitch />
            </div>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <p className="text-sm font-semibold">{group.title}</p>
              <ul className="mt-3 space-y-2">
                {group.items.map((item) => (
                  <li key={item} className="text-sm text-[var(--color-text-muted)]">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
            <Shield className="h-4 w-4 text-primary-accent" aria-hidden />
            {t('footer.security.title')}
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {t('footer.security.compliance')} {t('footer.security.dataProtection')} {t('footer.security.memberData')}
          </p>
        </div>

        <p className="mt-6 text-sm text-[var(--color-text-muted)]">
          {t('footer.dataSecure')} {t('footer.noHiddenFees')}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-5 text-sm text-[var(--color-text-muted)]">
          <span>© {new Date().getFullYear()} {t('footer.brand')}</span>
          <span className="flex flex-wrap items-center gap-4">
            <Link to="/privacy" className="hover:text-primary-accent">{t('footer.privacy')}</Link>
            <a href="mailto:support@edmission.uz" className="hover:text-primary-accent">{t('footer.contact')}</a>
          </span>
        </div>
      </div>
    </footer>
  )
}
