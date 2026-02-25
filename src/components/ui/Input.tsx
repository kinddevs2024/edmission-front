import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: boolean
  left?: ReactNode
  right?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, success, left, right, className, id, type, ...props }, ref) {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')
    const rightContent = isPassword ? (
      <button
        type="button"
        tabIndex={-1}
        className="p-1 rounded hover:bg-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent"
        onClick={() => setShowPassword((v) => !v)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    ) : right

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-text)] mb-1">
            {label}
          </label>
        )}
        <div className="relative flex">
          {left && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">{left}</div>}
          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            className={cn(
              'w-full rounded-input border bg-[var(--color-card)] px-3 py-2 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent',
              error && 'border-red-500',
              success && 'border-green-500',
              left && 'pl-9',
              (rightContent || right) && 'pr-10',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
          {rightContent && <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] flex items-center">{rightContent}</div>}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    )
  }
)
