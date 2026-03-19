import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type SelectHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
  menuClassName?: string
  menuPortalScope?: string
}

type MenuPlacement = 'top' | 'bottom'

const MENU_GAP = 8
const MENU_MAX_HEIGHT = 320
const VIEWPORT_PADDING = 12

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m5 12 5 5L20 7" />
    </svg>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      label,
      error,
      options,
      placeholder,
      menuClassName,
      menuPortalScope,
      className,
      id,
      value,
      defaultValue,
      onChange,
      onBlur,
      disabled,
      name,
      size: _omitSize,
      ...rest
    },
    forwardedRef
  ) {
    const { t } = useTranslation('common')
    const generatedId = useId().replace(/:/g, '')
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-') ?? `select-${generatedId}`
    const menuId = `${inputId}-menu`
    const triggerRef = useRef<HTMLButtonElement | null>(null)
    const nativeSelectRef = useRef<HTMLSelectElement | null>(null)
    const menuRef = useRef<HTMLDivElement | null>(null)
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
    const [open, setOpen] = useState(false)
    const [placement, setPlacement] = useState<MenuPlacement>('bottom')
    const [menuStyle, setMenuStyle] = useState<CSSProperties>({})
    const [highlightedIndex, setHighlightedIndex] = useState(0)
    const [internalValue, setInternalValue] = useState(() => String(value ?? defaultValue ?? ''))
    const isControlled = value != null
    const selectedValue = isControlled ? String(value ?? '') : internalValue

    const allOptions = useMemo(
      () => (placeholder ? [{ value: '', label: placeholder }, ...options] : options),
      [options, placeholder]
    )

    const selectedIndex = Math.max(
      0,
      allOptions.findIndex((option) => option.value === selectedValue)
    )
    const selectedOption = allOptions[selectedIndex] ?? null

    const syncExternalRef = (node: HTMLSelectElement | null) => {
      nativeSelectRef.current = node
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
        return
      }
      if (forwardedRef) {
        forwardedRef.current = node
      }
    }

    const buildChangeEvent = () => {
      const nativeNode = nativeSelectRef.current as HTMLSelectElement
      return {
        target: nativeNode,
        currentTarget: nativeNode,
      } as ChangeEvent<HTMLSelectElement>
    }

    const buildBlurEvent = () => {
      const nativeNode = nativeSelectRef.current as HTMLSelectElement
      return {
        target: nativeNode,
        currentTarget: nativeNode,
      } as FocusEvent<HTMLSelectElement>
    }

    const emitChange = (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue)
      }
      if (nativeSelectRef.current) {
        nativeSelectRef.current.value = nextValue
      }
      onChange?.(buildChangeEvent())
    }

    const emitBlur = () => {
      onBlur?.(buildBlurEvent())
    }

    const updateMenuPosition = () => {
      if (!triggerRef.current || typeof window === 'undefined') return

      const rect = triggerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const spaceBelow = viewportHeight - rect.bottom - VIEWPORT_PADDING - MENU_GAP
      const spaceAbove = rect.top - VIEWPORT_PADDING - MENU_GAP
      const shouldOpenTop = spaceBelow < 180 && spaceAbove > spaceBelow
      const nextPlacement: MenuPlacement = shouldOpenTop ? 'top' : 'bottom'
      const availableHeight = shouldOpenTop ? spaceAbove : spaceBelow
      const maxHeight = clamp(availableHeight, 140, MENU_MAX_HEIGHT)
      const width = clamp(rect.width, 180, viewportWidth - VIEWPORT_PADDING * 2)
      const left = clamp(rect.left, VIEWPORT_PADDING, viewportWidth - width - VIEWPORT_PADDING)

      setPlacement(nextPlacement)
      setMenuStyle({
        position: 'fixed',
        left,
        width,
        maxHeight,
        top: nextPlacement === 'bottom' ? rect.bottom + MENU_GAP : undefined,
        bottom: nextPlacement === 'top' ? viewportHeight - rect.top + MENU_GAP : undefined,
      })
    }

    const closeMenu = () => {
      setOpen(false)
    }

    const openMenu = () => {
      if (disabled) return
      updateMenuPosition()
      setHighlightedIndex(selectedIndex)
      setOpen(true)
    }

    const selectOption = (nextValue: string) => {
      emitChange(nextValue)
      closeMenu()
      triggerRef.current?.focus()
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled || allOptions.length === 0) return

      if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault()
        openMenu()
        return
      }

      if (!open) return

      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu()
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setHighlightedIndex((current) => Math.min(current + 1, allOptions.length - 1))
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setHighlightedIndex((current) => Math.max(current - 1, 0))
        return
      }

      if (event.key === 'Home') {
        event.preventDefault()
        setHighlightedIndex(0)
        return
      }

      if (event.key === 'End') {
        event.preventDefault()
        setHighlightedIndex(allOptions.length - 1)
        return
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        const option = allOptions[highlightedIndex]
        if (option) {
          selectOption(option.value)
        }
      }
    }

    useEffect(() => {
      if (isControlled || !nativeSelectRef.current) return
      const domValue = nativeSelectRef.current.value ?? ''
      if (domValue !== internalValue) {
        setInternalValue(domValue)
      }
    })

    useEffect(() => {
      if (!open) return

      const handlePointerDown = (event: MouseEvent | globalThis.MouseEvent) => {
        const target = event.target as Node | null
        if (!target) return
        if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
        closeMenu()
      }

      const handleViewportChange = () => {
        updateMenuPosition()
      }

      document.addEventListener('mousedown', handlePointerDown)
      window.addEventListener('resize', handleViewportChange)
      window.addEventListener('scroll', handleViewportChange, true)

      return () => {
        document.removeEventListener('mousedown', handlePointerDown)
        window.removeEventListener('resize', handleViewportChange)
        window.removeEventListener('scroll', handleViewportChange, true)
      }
    }, [open, selectedIndex])

    useEffect(() => {
      if (!open) return
      optionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
    }, [highlightedIndex, open])

    const triggerClasses = cn(
      'group relative min-h-[44px] w-full overflow-hidden rounded-input border px-3 py-2.5 pr-11 text-left text-[var(--color-text)] transition-all duration-200',
      'bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] shadow-[0_16px_34px_-28px_rgba(15,23,42,0.7)]',
      'hover:border-primary-accent/45 hover:shadow-[0_22px_42px_-30px_rgba(132,204,22,0.45)]',
      'focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-0',
      'dark:bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(15,23,42,0.94))]',
      !error && !open && 'border-[var(--color-border)]',
      open && 'border-primary-accent/60 ring-2 ring-primary-accent/15',
      error && 'border-red-500 focus:ring-red-500',
      disabled && 'cursor-not-allowed opacity-60 shadow-none',
      className
    )

    const menuContent = (
      <div
        ref={menuRef}
        id={menuId}
        role="listbox"
        data-select-portal-scope={menuPortalScope}
        className={cn(
          'z-[70] overflow-y-auto rounded-[22px] border border-[var(--color-border)] bg-[var(--color-card)] p-2 shadow-[0_30px_70px_-34px_rgba(15,23,42,0.75)] backdrop-blur animate-modal-enter',
          menuClassName
        )}
        style={menuStyle}
      >
        {allOptions.length > 0 ? (
          <div className="space-y-1">
            {allOptions.map((option, index) => {
              const isSelected = option.value === selectedValue
              const isHighlighted = index === highlightedIndex
              return (
                <button
                  key={`${option.value || '_empty'}-${index}`}
                  ref={(node) => {
                    optionRefs.current[index] = node
                  }}
                  id={`${menuId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    'flex w-full items-center justify-between rounded-[16px] px-3 py-2.5 text-sm transition-colors',
                    isHighlighted && !isSelected && 'bg-[var(--color-border)]/55 text-[var(--color-text)]',
                    isSelected && 'bg-primary-accent/14 text-[var(--color-text)]',
                    !isHighlighted && !isSelected && 'text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/35 hover:text-[var(--color-text)]'
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectOption(option.value)}
                >
                  <span className={cn('truncate text-left', option.value === '' && 'text-[var(--color-text-muted)]')}>
                    {option.label}
                  </span>
                  <span className={cn('ml-3 flex h-6 w-6 items-center justify-center rounded-full', isSelected ? 'bg-primary-accent/20 text-primary-accent' : 'text-transparent')}>
                    <CheckIcon className="h-4 w-4" />
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="rounded-[16px] px-3 py-2 text-sm text-[var(--color-text-muted)]">
            {t('noOptions', 'No options')}
          </div>
        )}
        <div
          className={cn(
            'pointer-events-none absolute left-6 h-3 w-3 rotate-45 border border-[var(--color-border)] bg-[var(--color-card)]',
            placement === 'bottom' ? '-top-[7px] border-b-0 border-r-0' : '-bottom-[7px] border-l-0 border-t-0'
          )}
        />
      </div>
    )

    const menu = open && typeof document !== 'undefined'
      ? createPortal(menuContent, document.body)
      : null

    const nativeSelectProps = isControlled
      ? { value: selectedValue }
      : { defaultValue: String(defaultValue ?? selectedValue) }

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-[var(--color-text)]">
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={syncExternalRef}
            name={name}
            disabled={disabled}
            tabIndex={-1}
            aria-hidden
            className="pointer-events-none absolute h-0 w-0 opacity-0"
            onChange={onChange}
            onBlur={onBlur}
            {...nativeSelectProps}
            {...rest}
          >
            {allOptions.map((option, index) => (
              <option key={`${option.value || '_empty'}-native-${index}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            ref={triggerRef}
            id={inputId}
            type="button"
            className={triggerClasses}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open ? menuId : undefined}
            aria-invalid={!!error}
            aria-activedescendant={open ? `${menuId}-option-${highlightedIndex}` : undefined}
            disabled={disabled}
            onClick={() => (open ? closeMenu() : openMenu())}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              window.setTimeout(() => {
                const activeElement = document.activeElement
                if (activeElement && (triggerRef.current?.contains(activeElement) || menuRef.current?.contains(activeElement))) return
                closeMenu()
                emitBlur()
              }, 0)
            }}
          >
            <span className={cn('block truncate pr-2', selectedValue === '' && 'text-[var(--color-text-muted)]')}>
              {selectedOption?.label ?? placeholder ?? t('select', 'Select')}
            </span>
            <span
              className={cn(
                'absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/85 text-[var(--color-text-muted)] transition-all duration-200',
                open && 'border-primary-accent/45 bg-primary-accent/12 text-primary-accent'
              )}
            >
              <ChevronDownIcon className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} />
            </span>
          </button>
        </div>

        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-500">
            {error}
          </p>
        )}

        {menu}
      </div>
    )
  }
)
