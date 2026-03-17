import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/utils/cn'

type BackLinkProps = {
  children: ReactNode
  to?: string
  onClick?: () => void
  className?: string
}

const baseClasses = cn(
  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200',
  'border-[var(--color-border)] bg-[var(--color-card)]/90 text-[var(--color-text)] shadow-[0_18px_34px_-28px_rgba(15,23,42,0.65)] backdrop-blur',
  'hover:-translate-x-0.5 hover:border-primary-accent/45 hover:bg-primary-accent/8 hover:text-primary-accent',
  'focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-2'
)

export function BackLink({ children, to, onClick, className }: BackLinkProps) {
  const content = (
    <>
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-border)]/80 text-[var(--color-text)]">
        <ArrowLeft className="h-4 w-4" />
      </span>
      <span>{children}</span>
    </>
  )

  if (to) {
    return (
      <Link to={to} className={cn(baseClasses, className)}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={cn(baseClasses, className)}>
      {content}
    </button>
  )
}
