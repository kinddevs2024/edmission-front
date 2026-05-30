import { forwardRef, useRef, useState, useEffect, type ChangeEvent, type InputHTMLAttributes, type MutableRefObject, type UIEvent, type KeyboardEvent } from 'react'
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
  revealDelayMs?: number
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
      revealDelayMs = 1000,
      className,
      id,
      placeholder,
      onBlur,
      onFocus,
      name,
      autoComplete = 'current-password',
      disabled,
      ...props
    },
    ref
  ) {
    const { t } = useTranslation('common')
    const inputRef = useRef<HTMLInputElement | null>(null)
    const overlayRef = useRef<HTMLInputElement | null>(null)
    const [internalVisible, setInternalVisible] = useState(false)

    const manuallyVisible = typeof passwordVisible === 'boolean' ? passwordVisible : internalVisible
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')

    const [lastTypedIndex, setLastTypedIndex] = useState<number | null>(null)
    const [showLastChar, setShowLastChar] = useState(false)
    const timeoutRef = useRef<number | null>(null)
    const prevValueRef = useRef(value)

    useEffect(() => {
      const prevValue = prevValueRef.current
      prevValueRef.current = value

      if (!value) {
        setShowLastChar(false)
        setLastTypedIndex(null)
        return
      }

      // If a single character was added (typing)
      if (value.length === prevValue.length + 1) {
        let index = value.length - 1
        for (let i = 0; i < prevValue.length; i++) {
          if (value[i] !== prevValue[i]) {
            index = i
            break
          }
        }
        setLastTypedIndex(index)
        setShowLastChar(true)

        if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
        timeoutRef.current = window.setTimeout(() => {
          setShowLastChar(false)
        }, revealDelayMs)
      } else {
        // If characters were deleted, pasted, or autofilled
        setShowLastChar(false)
        setLastTypedIndex(null)
      }

      return () => {
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      }
    }, [value])

    // Sync scroll position from real input to overlay input
    const syncScroll = (target: HTMLInputElement) => {
      if (overlayRef.current) {
        overlayRef.current.scrollLeft = target.scrollLeft
      }
    }

    const assignRef = (node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as MutableRefObject<HTMLInputElement | null>).current = node
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      onValueChange(e.target.value)
      // Run in microtask/next-tick to ensure DOM state is updated before syncing
      const target = e.target
      setTimeout(() => syncScroll(target), 0)
    }

    const handleScroll = (e: UIEvent<HTMLInputElement>) => {
      syncScroll(e.currentTarget)
    }

    const handleKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
      syncScroll(e.currentTarget)
    }

    // Determine the text to display in our overlay
    const getDisplayValue = () => {
      if (manuallyVisible) {
        return value
      }
      return value
        .split('')
        .map((char, index) => {
          if (showLastChar && index === lastTypedIndex) {
            return char
          }
          return '•'
        })
        .join('')
    }

    const displayValue = getDisplayValue()

    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-[var(--color-text)]">
            {label}
          </label>
        ) : null}
        <div className="relative">
          {/* Native underlying input that receives typing, cursor, selection, and autofill */}
          <input
            ref={assignRef}
            type={manuallyVisible ? 'text' : 'password'}
            id={inputId}
            name={name}
            autoComplete={autoComplete}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={disabled}
            value={value}
            placeholder={value ? '' : placeholder}
            onChange={handleChange}
            onScroll={handleScroll}
            onKeyUp={handleKeyUp}
            onFocus={onFocus}
            onBlur={onBlur}
            className={cn(
              'peer min-h-[44px] w-full rounded-input border bg-[var(--color-card)] px-3 py-2.5 pr-11 font-mono text-[var(--color-text)] transition-colors duration-150',
              'placeholder:text-[var(--color-text-muted)]/60',
              'focus:outline-none focus:ring-2 focus:ring-primary-accent/15 focus:ring-offset-0 focus:border-primary-accent',
              error && 'border-red-500 focus:ring-red-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_2px_0_0_rgba(239,68,68,0.2)]',
              !error && 'border-[var(--color-border)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_2px_0_0_rgba(0,0,0,0.05),0_3px_5px_0_rgba(0,0,0,0.03)]',
              className
            )}
            style={{
              color: 'transparent',
              caretColor: 'var(--color-text)',
            }}
            aria-invalid={!!error}
            aria-describedby={[error ? `${inputId}-error` : null, hint ? `${inputId}-hint` : null].filter(Boolean).join(' ') || undefined}
            {...props}
          />

          {/* Masking overlay containing the temporary "last character visible" behavior */}
          <input
            ref={overlayRef}
            type="text"
            tabIndex={-1}
            readOnly
            disabled={disabled}
            value={value ? displayValue : ''}
            placeholder={placeholder}
            className={cn(
              'absolute inset-0 pointer-events-none select-none w-full h-full rounded-input border border-transparent bg-transparent px-3 py-2.5 pr-11 font-mono text-[var(--color-text)]',
              'peer-autofill:opacity-0 transition-opacity duration-75 focus:outline-none focus:ring-0 focus:border-transparent',
              disabled && 'opacity-50',
              className
            )}
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
