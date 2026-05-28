import { type ButtonHTMLAttributes, type MouseEventHandler, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin h-4 w-4 flex-shrink-0', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children?: ReactNode
  className?: string
  to?: string
  icon?: ReactNode
  loading?: boolean
}

const baseClasses = 'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-100 ease-out focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 transform active:translate-y-[3px] disabled:translate-y-0 disabled:shadow-none'

const variantClasses = {
  primary: cn(
    'border border-t-white/30 border-x-transparent border-b-transparent bg-primary-accent text-primary-dark',
    'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_3px_0_0_rgba(0,0,0,0.22),0_4px_6px_0_rgba(0,0,0,0.12)]',
    'hover:bg-primary-accent/95 hover:-translate-y-[1px] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45),0_4px_0_0_rgba(0,0,0,0.22),0_6px_10px_0_rgba(0,0,0,0.15)]',
    'active:translate-y-[3px] active:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_0px_0_0_rgba(0,0,0,0.22),0_1px_3px_0_rgba(0,0,0,0.08)]',
    'disabled:border-[var(--color-border)] disabled:bg-[var(--color-border)] disabled:text-[var(--color-text-muted)]'
  ),
  secondary: cn(
    'border border-t-white/50 border-x-[var(--color-border)] border-b-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)]',
    'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_3px_0_0_rgba(0,0,0,0.06),0_4px_6px_0_rgba(0,0,0,0.04)]',
    'hover:bg-[var(--color-bg)] hover:-translate-y-[1px] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7),0_4px_0_0_rgba(0,0,0,0.06),0_6px_10px_0_rgba(0,0,0,0.06)]',
    'active:translate-y-[3px] active:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_0px_0_0_rgba(0,0,0,0.06),0_1px_3px_0_rgba(0,0,0,0.03)]',
    'disabled:bg-[var(--color-border)]/40 disabled:text-[var(--color-text-muted)]'
  ),
  ghost: 'bg-transparent text-[var(--color-text)] hover:bg-[var(--color-border)]/70 hover:translate-y-0 active:translate-y-0 active:scale-[0.98] shadow-none hover:shadow-none active:shadow-none',
  danger: cn(
    'border border-t-white/30 border-x-transparent border-b-transparent bg-red-500 text-white',
    'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_3px_0_0_rgba(0,0,0,0.25),0_4px_6px_0_rgba(0,0,0,0.15)]',
    'hover:bg-red-600 hover:-translate-y-[1px] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45),0_4px_0_0_rgba(0,0,0,0.25),0_6px_10px_0_rgba(0,0,0,0.18)]',
    'active:translate-y-[3px] active:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_0px_0_0_rgba(0,0,0,0.25),0_1px_3px_0_rgba(0,0,0,0.1)]'
  ),
}

const sizeClasses = {
  sm: 'min-h-9 px-3 py-1.5 text-sm',
  md: 'min-h-10 px-4 py-2 text-sm',
  lg: 'min-h-11 px-5 py-2.5 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  loading = false,
  to,
  icon,
  onClick,
  ...props
}: ButtonProps) {
  const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className)
  const isDisabled = disabled || loading
  const content = (
    <>
      {loading && <Spinner className={size === 'sm' ? 'h-3.5 w-3.5' : undefined} />}
      {!loading && icon && <span className="shrink-0 flex items-center [&>svg]:size-4">{icon}</span>}
      {children != null ? children : ''}
    </>
  )
  if (to && !loading) {
    return (
      <Link to={to} className={classes} onClick={onClick as MouseEventHandler<HTMLAnchorElement> | undefined}>
        {content}
      </Link>
    )
  }
  return (
    <button type={props.type ?? 'button'} className={classes} disabled={isDisabled} onClick={onClick} {...props}>
      {content}
    </button>
  )
}
