import { forwardRef, useRef, useState, type ChangeEvent, type InputHTMLAttributes, type MutableRefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/utils/cn'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string
  error?: string
  hint?: string
  value: string
  onValueChange: (value: string) => void
  passwordVisible?: boolean
  onPasswordVisibilityToggle?: () => void
  showPasswordToggle?: boolean
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      label,
      error,
      hint,
      value,
      onValueChange,
      passwordVisible,
      onPasswordVisibilityToggle,
      showPasswordToggle = true,
      className,
      id,
      placeholder,
      onBlur,
      name,
      autoComplete,
      disabled,
      ...props
    },
    ref
  ) {
    const { t } = useTranslation('common')
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [internalVisible, setInternalVisible] = useState(false)

    const manuallyVisible = typeof passwordVisible === 'boolean' ? passwordVisible : internalVisible
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')

    const assignRef = (node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as MutableRefObject<HTMLInputElement | null>).current = node
    }

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      onValueChange(event.target.value)
    }

    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-[var(--color-text)]">
            {label}
          </label>
        ) : null}
        <div className="relative">
          <input
            ref={assignRef}
            id={inputId}
            name={name}
            type={manuallyVisible ? 'text' : 'password'}
            autoComplete={autoComplete}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={disabled}
            value={value}
            placeholder={placeholder}
            onChange={handleChange}
            onInput={(event) => onValueChange(event.currentTarget.value)}
            onBlur={onBlur}
            className={cn(
              'min-h-[44px] w-full rounded-input border bg-transparent px-3 py-2.5 pr-11 text-[var(--color-text)]',
              'placeholder:text-[var(--color-text-muted)]/60',
              'focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-0 focus:border-transparent',
              error && 'border-red-500 focus:ring-red-500',
              !error && 'border-[var(--color-border)]',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={[error ? `${inputId}-error` : null, hint ? `${inputId}-hint` : null].filter(Boolean).join(' ') || undefined}
            {...props}
          />
          {showPasswordToggle ? (
            <div className="pointer-events-auto absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center">
              <button
                type="button"
                tabIndex={-1}
                className="rounded p-1 text-gray-600 hover:bg-black/10 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  if (onPasswordVisibilityToggle) onPasswordVisibilityToggle()
                  else setInternalVisible((v) => !v)
                  inputRef.current?.focus()
                }}
                aria-label={manuallyVisible ? t('hidePassword') : t('showPassword')}
              >
                {manuallyVisible ? <EyeOff className="h-[18px] w-[18px]" aria-hidden /> : <Eye className="h-[18px] w-[18px]" aria-hidden />}
              </button>
            </div>
          ) : null}
        </div>
        {error ? <p id={`${inputId}-error`} className="mt-1 text-sm text-red-500">{error}</p> : null}
        {hint && !error ? <p id={`${inputId}-hint`} className="mt-1 text-sm text-gray-500 dark:text-gray-400">{hint}</p> : null}
      </div>
    )
  }
)
