import { type ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface PageTitleProps {
  title: string
  /** Kept for API compatibility; not shown visually. */
  icon?: string
  className?: string
  children?: ReactNode
}

/** Visual page heading removed — title is screen-reader only. Toolbar `children` still render when passed. */
export function PageTitle({ title, className, children }: PageTitleProps) {
  return (
    <>
      <h1 className="sr-only">{title}</h1>
      {children != null ? (
        <div className={cn('flex flex-wrap items-center gap-2 gap-y-1 mb-4', className)}>{children}</div>
      ) : null}
    </>
  )
}
