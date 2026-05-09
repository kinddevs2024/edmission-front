import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageMenu } from '@/components/layout/LanguageMenu'
import { ThemeSwitch } from '@/components/ui/ThemeSwitch'

export function FooterSection() {
  const { t } = useTranslation('landing')
  const FOOTER_LINKS = [
    {
      title: t('footer.platform.title'),
      items: [
        { label: t('footer.platform.0'), to: '/#about-us' },
        { label: t('footer.platform.1'), to: '/how-edmission-works' },
        { label: t('footer.platform.2'), to: '/#ai-matching' },
      ],
    },
    {
      title: t('footer.students.title'),
      items: [
        { label: t('footer.students.0'), to: '/explore' },
        { label: t('footer.students.1'), to: '/student/interests' },
        { label: t('footer.students.2'), to: '/student/offers' },
      ],
    },
    {
      title: t('footer.universities.title'),
      items: [
        { label: t('footer.universities.0'), to: '/university/students' },
        { label: t('footer.universities.1'), to: '/university/pipeline' },
        { label: t('footer.universities.2'), to: '/university/scholarships' },
      ],
    },
    {
      title: t('footer.support.title'),
      items: [
        { label: t('footer.support.0'), to: '/privacy' },
        { label: t('footer.support.1'), to: '/support' },
        { label: t('footer.support.2'), to: 'mailto:support@edmission.uz' },
      ],
    },
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
                  <li key={item.label}>
                    {item.to.startsWith('mailto:') || item.to.startsWith('/#') ? (
                      <a href={item.to} className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-primary-accent">
                        {item.label}
                      </a>
                    ) : (
                      <Link to={item.to} className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-primary-accent">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-5 text-sm text-[var(--color-text-muted)]">
          <span>© {new Date().getFullYear()} {t('footer.brand')}</span>
          <span className="flex flex-wrap items-center gap-4">
            <Link to="/privacy" className="hover:text-primary-accent">{t('footer.privacy')}</Link>
            <Link to="/cookies" className="hover:text-primary-accent">{t('footer.cookies')}</Link>
            <a href="mailto:support@edmission.uz" className="hover:text-primary-accent">{t('footer.contact')}</a>
          </span>
        </div>
      </div>
    </footer>
  )
}
