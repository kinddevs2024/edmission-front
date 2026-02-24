import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  className?: string
  to?: string
}

const baseClasses = 'inline-flex items-center justify-center font-medium rounded-input transition-colors focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
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
  to,
  ...props
}: ButtonProps) {
  const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className)
  if (to) {
    return <Link to={to} className={classes}>{children}</Link>
  }
  return (
    <button
      type="button"
      className={cn(
        classes
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
