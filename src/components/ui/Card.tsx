import { type ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface CardProps {
  children: ReactNode
  className?: string
  /** Hover: lift + stronger shadow */
  interactive?: boolean
  /** Hover: subtle 3D tilt (use on cards in grids) */
  tilt?: boolean
}

export function Card({ children, className, interactive, tilt }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card bg-[var(--color-card)] border border-[var(--color-border)] p-4',
        interactive && 'card-interactive',
        tilt && 'card-3d',
        !interactive && !tilt && 'shadow-[var(--shadow-card)]',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={cn('mb-3 font-semibold text-lg', className)}>{children}</div>
}

export function CardTitle({ children, className }: CardProps) {
  return <h3 className={cn('text-h3 font-semibold', className)}>{children}</h3>
}
