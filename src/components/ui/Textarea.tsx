import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

interface TextareaProps extends Omit<React.ComponentProps<'textarea'>, 'size'> {
  label?: string
  /** Boolean or error message string (same pattern as `Input`). */
  error?: boolean | string
  resize?: boolean
  /** Kept for API compatibility; styling matches app inputs. */
  variant?: 'outlined' | 'standard' | 'static'
  color?: 'green' | 'blue' | 'gray' | 'amber' | 'red'
  size?: 'md' | 'lg'
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      error,
      resize = false,
      variant: _variant = 'outlined',
      color: _color = 'green',
      size = 'md',
      className,
      id,
      rows = 4,
      placeholder,
      ...props
    },
    ref
  ) {
    const hasError = Boolean(error)
    const errorMessage = typeof error === 'string' ? error : undefined
    const tid = id ?? (label ? String(label).toLowerCase().replace(/\s+/g, '-') : undefined)
    const minH = size === 'lg' ? 'min-h-[120px]' : 'min-h-[88px]'

    return (
      <div className="w-full min-w-0">
        {label ? (
          <label htmlFor={tid} className="mb-1 block text-sm font-medium text-[var(--color-text)]">
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={tid}
          rows={rows}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-input border bg-[var(--color-card)] px-3 py-2.5 text-[var(--color-text)] transition-colors duration-150',
            'placeholder:text-[var(--color-text-muted)]/60',
            'focus:outline-none focus:ring-2 focus:ring-primary-accent/15 focus:ring-offset-0 focus:border-primary-accent',
            hasError ? 'border-red-500 focus:ring-red-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_2px_0_0_rgba(239,68,68,0.2)]' : 'border-[var(--color-border)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_2px_0_0_rgba(0,0,0,0.05),0_3px_5px_0_rgba(0,0,0,0.03)]',
            !resize && 'resize-none',
            minH,
            className
          )}
          aria-invalid={hasError}
          aria-describedby={errorMessage && tid ? `${tid}-error` : undefined}
          {...props}
        />
        {errorMessage ? (
          <p id={`${tid}-error`} className="mt-1 text-sm text-red-500">
            {errorMessage}
          </p>
        ) : null}
      </div>
    )
  }
)
