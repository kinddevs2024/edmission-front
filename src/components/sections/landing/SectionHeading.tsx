import { type ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface SectionHeadingProps {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  className?: string
  actions?: ReactNode
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
  actions,
}: SectionHeadingProps) {
  const centered = align === 'center'
  return (
    <div className={cn(centered && 'text-center', className)}>
      {eyebrow && (
        <p className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-3 text-3xl font-semibold leading-tight text-[var(--color-text)] md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className={cn('mt-4 max-w-2xl text-base text-[var(--color-text-muted)]', centered && 'mx-auto')}>
          {description}
        </p>
      )}
      {actions && <div className={cn('mt-6 flex gap-3', centered ? 'justify-center' : 'justify-start')}>{actions}</div>}
    </div>
  )
}
