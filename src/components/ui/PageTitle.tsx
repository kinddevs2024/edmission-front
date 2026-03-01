import { type ReactNode } from 'react'
import { getNavIcon } from '@/components/icons/NavIcons'
import { cn } from '@/utils/cn'

interface PageTitleProps {
  title: string
  icon?: string
  className?: string
  children?: ReactNode
}

export function PageTitle({ title, icon, className, children }: PageTitleProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2 gap-y-1 mb-4', className)}>
      {icon && (
        <span className="flex items-center justify-center text-[var(--color-text-muted)]" aria-hidden>
          {getNavIcon(icon, 'size-7')}
        </span>
      )}
      <h1 className="text-h1 font-semibold">{title}</h1>
      {children}
    </div>
  )
}
