import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import { DateInput } from '@/components/ui/DateInput'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  success?: boolean
  left?: ReactNode
  right?: ReactNode
  passwordVisible?: boolean
  onPasswordVisibilityToggle?: () => void
  showPasswordToggle?: boolean
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, hint, success, left, right, passwordVisible, onPasswordVisibilityToggle, showPasswordToggle = true, className, id, type, placeholder, size: _size, color: _color, ...props }, ref) {
    const { t } = useTranslation('common')
    const [internalShow, setInternalShow] = useState(false)
    if (type === 'date') {
      return (
        <DateInput
          ref={ref}
          id={id}
          label={label}
          error={error}
          hint={hint}
          success={success}
          left={left}
          right={right}
          className={className}
          placeholder={placeholder}
          {...props}
        />
      )
    }
    const isPassword = type === 'password'
    const isControlled = isPassword && typeof passwordVisible === 'boolean' && typeof onPasswordVisibilityToggle === 'function'
    const showPassword = isControlled ? passwordVisible : internalShow
    const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')

    const icon = left ?? (isPassword && showPasswordToggle ? (
      <button
        type="button"
        tabIndex={-1}
        className="relative z-20 p-1 rounded hover:bg-black/10 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (isControlled) onPasswordVisibilityToggle?.()
          else setInternalShow((v) => !v)
        }}
        aria-label={showPassword ? t('hidePassword') : t('showPassword')}
      >
        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    ) : right)

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            placeholder={placeholder}
            className={cn(
              'min-h-11 w-full rounded-lg border bg-[var(--color-card)] px-3.5 py-2.5 text-sm text-[var(--color-text)] transition-colors duration-150 focus:outline-none focus:ring-4 focus:ring-primary-accent/15 focus:border-primary-accent',
              'placeholder:text-[var(--color-text-muted)]/60',
              error && 'border-red-500 focus:ring-red-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_2px_0_0_rgba(239,68,68,0.2)]',
              success && 'border-green-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_2px_0_0_rgba(34,197,94,0.2)]',
              !error && !success && 'border-[var(--color-border)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_2px_0_0_rgba(0,0,0,0.05),0_3px_5px_0_rgba(0,0,0,0.03)]',
              icon && 'pr-11',
              isPassword && showPasswordToggle && 'edmission-password-custom-toggle',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={[error ? `${inputId}-error` : null, hint ? `${inputId}-hint` : null].filter(Boolean).join(' ') || undefined}
            {...props}
          />
          {icon && (
            <div className="pointer-events-auto absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center">
              {icon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-[var(--color-text-muted)]">{hint}</p>
        )}
      </div>
    )
  }
)
