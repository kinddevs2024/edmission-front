import { Link } from 'react-router-dom'
import { LanguageMenu } from '@/components/layout/LanguageMenu'
import { ThemeSwitch } from '@/components/ui/ThemeSwitch'

const FOOTER_LINKS = [
  { title: 'Platform', items: ['About', 'Infrastructure', 'AI Matching'] },
  { title: 'Students', items: ['Explore Universities', 'Applications', 'Offers'] },
  { title: 'Universities', items: ['Discovery', 'Pipeline', 'Scholarships'] },
  { title: 'Support', items: ['Security', 'Help Center', 'Contact'] },
]

export function FooterSection() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-card)]/70">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <p className="text-xl font-semibold">Edmission</p>
            <p className="mt-2 max-w-sm text-sm text-[var(--color-text-muted)]">
              Academic infrastructure platform connecting students and universities without intermediaries.
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
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-5 text-sm text-[var(--color-text-muted)]">
          <span>© {new Date().getFullYear()} Edmission</span>
          <Link to="/privacy" className="hover:text-primary-accent">Privacy</Link>
        </div>
      </div>
    </footer>
  )
}
