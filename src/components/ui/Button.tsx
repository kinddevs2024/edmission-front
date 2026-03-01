import { type ButtonHTMLAttributes, type ReactNode } from 'react'
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
  children: ReactNode
  className?: string
  to?: string
  /** Иконка слева от текста */
  icon?: ReactNode
  /** Показывать спиннер слева от текста и блокировать кнопку */
  loading?: boolean
}

const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-input transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]'
const variantClasses = {
  primary: 'bg-primary-accent text-primary-dark hover:bg-primary-accent/90',
  secondary: 'border-2 border-[var(--color-border)] bg-transparent hover:bg-[var(--color-border)]',
  ghost: 'bg-transparent hover:bg-[var(--color-border)]',
  danger: 'bg-red-500 text-white hover:bg-red-600',
}
const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
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
  ...props
}: ButtonProps) {
  const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className)
  const isDisabled = disabled || loading
  const content = (
    <>
      {loading && <Spinner className={size === 'sm' ? 'h-3.5 w-3.5' : undefined} />}
      {!loading && icon && <span className="shrink-0 flex items-center [&>svg]:size-4">{icon}</span>}
      {children}
    </>
  )
  if (to && !loading) {
    return <Link to={to} className={classes}>{content}</Link>
  }
  return (
    <button
      type={props.type ?? 'button'}
      className={classes}
      disabled={isDisabled}
      {...props}
    >
      {content}
    </button>
  )
}
