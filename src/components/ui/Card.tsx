import { type ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface CardProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  /** Hover: lift + stronger shadow */
  interactive?: boolean
  /** Hover: subtle 3D tilt (use on cards in grids) */
  tilt?: boolean
}

export function Card({ children, className, style, interactive, tilt }: CardProps) {
  return (
    <div
      style={style}
      className={cn(
        'rounded-xl border bg-[var(--color-card)] p-4 transition-all duration-200 ease-out',
        'border-[var(--color-border)]',
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_0_rgba(0,0,0,0.04)]',
        interactive && 'hover:-translate-y-[4px] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.75),0_8px_0_0_rgba(0,0,0,0.05),0_12px_24px_0_rgba(0,0,0,0.06)] active:translate-y-0 active:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_2px_0_0_rgba(0,0,0,0.05),0_4px_8px_0_rgba(0,0,0,0.03)] cursor-pointer',
        tilt && 'card-3d',
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
