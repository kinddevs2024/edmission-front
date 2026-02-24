import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: boolean
  left?: ReactNode
  right?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, success, left, right, className, id, ...props }, ref) {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')
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
          className={cn(
            'w-full rounded-input border bg-[var(--color-card)] px-3 py-2 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent',
            error && 'border-red-500',
            success && 'border-green-500',
            left && 'pl-9',
            right && 'pr-9',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {right && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">{right}</div>}
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
