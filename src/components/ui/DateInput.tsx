import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FocusEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Select } from '@/components/ui/Select'

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  hint?: string
  success?: boolean
  left?: ReactNode
  right?: ReactNode
}

type PickerPlacement = 'top' | 'bottom'
type VisibleMonth = {
  year: number
  month: number
}

const PICKER_GAP = 8
const PICKER_WIDTH = 328
const PICKER_MAX_HEIGHT = 430
const VIEWPORT_PADDING = 12
const YEAR_RANGE_PAST = 100
const YEAR_RANGE_FUTURE = 20

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function toDateValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseDateValue(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

function getToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function getVisibleMonth(date: Date): VisibleMonth {
  return { year: date.getFullYear(), month: date.getMonth() }
}

function shiftMonth(visibleMonth: VisibleMonth, delta: number): VisibleMonth {
  const date = new Date(visibleMonth.year, visibleMonth.month + delta, 1)
  return getVisibleMonth(date)
}

function getWeekdayOffset(date: Date) {
  return (date.getDay() + 6) % 7
}

function isWithinRange(value: string, min?: string, max?: string) {
  if (min && value < min) return false
  if (max && value > max) return false
  return true
}

function buildCalendarDays(visibleMonth: VisibleMonth, min?: string, max?: string) {
  const todayValue = toDateValue(getToday())
  const firstDay = new Date(visibleMonth.year, visibleMonth.month, 1)
  const gridStart = new Date(visibleMonth.year, visibleMonth.month, 1 - getWeekdayOffset(firstDay))

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index)
    const value = toDateValue(date)
    return {
      key: value,
      value,
      label: date.getDate(),
      inCurrentMonth: date.getMonth() === visibleMonth.month,
      isToday: value === todayValue,
      disabled: !isWithinRange(value, min, max),
    }
  })
}

function buildYearOptions(selectedDate: Date | null, min?: string, max?: string) {
  const currentYear = getToday().getFullYear()
  const selectedYear = selectedDate?.getFullYear() ?? currentYear
  const minYear = min ? parseInt(min.slice(0, 4), 10) : Math.min(selectedYear, currentYear) - YEAR_RANGE_PAST
  const maxYear = max ? parseInt(max.slice(0, 4), 10) : Math.max(selectedYear, currentYear) + YEAR_RANGE_FUTURE
  const years: number[] = []

  for (let year = maxYear; year >= minYear; year -= 1) {
    years.push(year)
  }

  return years
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  function DateInput(
    {
      label,
      error,
      hint,
      success,
      left,
      right,
      className,
      id,
      value,
      defaultValue,
      onChange,
      onBlur,
      disabled,
      placeholder,
      name,
      min,
      max,
      size: _omitSize,
      color: _omitColor,
      ...rest
    },
    forwardedRef
  ) {
    const { t, i18n } = useTranslation('common')
    const generatedId = useId().replace(/:/g, '')
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-') ?? `date-input-${generatedId}`
    const pickerId = `${inputId}-picker`
    const triggerRef = useRef<HTMLButtonElement | null>(null)
    const nativeInputRef = useRef<HTMLInputElement | null>(null)
    const pickerRef = useRef<HTMLDivElement | null>(null)
    const [open, setOpen] = useState(false)
    const [placement, setPlacement] = useState<PickerPlacement>('bottom')
    const [pickerStyle, setPickerStyle] = useState<CSSProperties>({})
    const initialValue = String(value ?? defaultValue ?? '')
    const [internalValue, setInternalValue] = useState(initialValue)
    const [visibleMonth, setVisibleMonth] = useState<VisibleMonth>(() => {
      const initialDate = parseDateValue(initialValue) ?? getToday()
      return getVisibleMonth(initialDate)
    })

    const locale = i18n.language || 'en'
    const isControlled = value != null
    const selectedValue = isControlled ? String(value ?? '') : internalValue
    const selectedDate = parseDateValue(selectedValue)
    const minValue = typeof min === 'string' ? min : undefined
    const maxValue = typeof max === 'string' ? max : undefined

    const monthFormatter = useMemo(
      () => new Intl.DateTimeFormat(locale, { month: 'long' }),
      [locale]
    )
    const weekdayFormatter = useMemo(
      () => new Intl.DateTimeFormat(locale, { weekday: 'short' }),
      [locale]
    )
    const displayFormatter = useMemo(
      () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }),
      [locale]
    )

    const monthOptions = useMemo(
      () =>
        Array.from({ length: 12 }, (_, month) => ({
          value: month,
          label: monthFormatter.format(new Date(2024, month, 1)),
        })),
      [monthFormatter]
    )

    const weekdayLabels = useMemo(
      () => Array.from({ length: 7 }, (_, index) => weekdayFormatter.format(new Date(2024, 0, index + 1))),
      [weekdayFormatter]
    )
    const monthSelectOptions = useMemo(
      () => monthOptions.map((option) => ({ value: String(option.value), label: option.label })),
      [monthOptions]
    )

    const yearOptions = useMemo(
      () => buildYearOptions(selectedDate, minValue, maxValue),
      [selectedDate, minValue, maxValue]
    )
    const yearSelectOptions = useMemo(
      () => yearOptions.map((year) => ({ value: String(year), label: String(year) })),
      [yearOptions]
    )

    const calendarDays = useMemo(
      () => buildCalendarDays(visibleMonth, minValue, maxValue),
      [visibleMonth, minValue, maxValue]
    )

    const syncExternalRef = (node: HTMLInputElement | null) => {
      nativeInputRef.current = node
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
        return
      }
      if (forwardedRef) {
        forwardedRef.current = node
      }
    }

    const buildChangeEvent = () => {
      const nativeNode = nativeInputRef.current as HTMLInputElement
      return {
        target: nativeNode,
        currentTarget: nativeNode,
      } as ChangeEvent<HTMLInputElement>
    }

    const buildBlurEvent = () => {
      const nativeNode = nativeInputRef.current as HTMLInputElement
      return {
        target: nativeNode,
        currentTarget: nativeNode,
      } as FocusEvent<HTMLInputElement>
    }

    const emitChange = (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue)
      }
      if (nativeInputRef.current) {
        nativeInputRef.current.value = nextValue
      }
      onChange?.(buildChangeEvent())
    }

    const emitBlur = () => {
      onBlur?.(buildBlurEvent())
    }

    const updatePickerPosition = () => {
      if (!triggerRef.current || typeof window === 'undefined') return

      const rect = triggerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const spaceBelow = viewportHeight - rect.bottom - VIEWPORT_PADDING - PICKER_GAP
      const spaceAbove = rect.top - VIEWPORT_PADDING - PICKER_GAP
      const shouldOpenTop = spaceBelow < 360 && spaceAbove > spaceBelow
      const nextPlacement: PickerPlacement = shouldOpenTop ? 'top' : 'bottom'
      const width = clamp(Math.max(rect.width, PICKER_WIDTH), 280, viewportWidth - VIEWPORT_PADDING * 2)
      const left = clamp(rect.left, VIEWPORT_PADDING, viewportWidth - width - VIEWPORT_PADDING)
      const maxHeight = clamp(nextPlacement === 'bottom' ? spaceBelow : spaceAbove, 220, PICKER_MAX_HEIGHT)

      setPlacement(nextPlacement)
      setPickerStyle({
        position: 'fixed',
        left,
        width,
        maxHeight,
        top: nextPlacement === 'bottom' ? rect.bottom + PICKER_GAP : undefined,
        bottom: nextPlacement === 'top' ? viewportHeight - rect.top + PICKER_GAP : undefined,
      })
    }

    const closePicker = () => {
      setOpen(false)
    }

    const openPicker = () => {
      if (disabled) return
      setVisibleMonth(getVisibleMonth(selectedDate ?? getToday()))
      updatePickerPosition()
      setOpen(true)
    }

    const selectDate = (nextValue: string) => {
      if (!isWithinRange(nextValue, minValue, maxValue)) return
      const nextDate = parseDateValue(nextValue)
      if (nextDate) {
        setVisibleMonth(getVisibleMonth(nextDate))
      }
      emitChange(nextValue)
      closePicker()
      triggerRef.current?.focus()
    }

    const clearValue = () => {
      emitChange('')
      closePicker()
      triggerRef.current?.focus()
    }

    const selectToday = () => {
      selectDate(toDateValue(getToday()))
    }

    useEffect(() => {
      if (isControlled || !nativeInputRef.current) return
      const domValue = nativeInputRef.current.value ?? ''
      if (domValue !== internalValue) {
        setInternalValue(domValue)
        const domDate = parseDateValue(domValue)
        if (domDate) {
          setVisibleMonth(getVisibleMonth(domDate))
        }
      }
    })

    useEffect(() => {
      if (!open) return

      const handlePointerDown = (event: MouseEvent) => {
        const target = event.target as Node | null
        if (!target) return
        if (target instanceof Element && target.closest(`[data-select-portal-scope="${pickerId}"]`)) return
        if (triggerRef.current?.contains(target) || pickerRef.current?.contains(target)) return
        closePicker()
      }

      const handleViewportChange = () => {
        updatePickerPosition()
      }

      document.addEventListener('mousedown', handlePointerDown)
      window.addEventListener('resize', handleViewportChange)
      window.addEventListener('scroll', handleViewportChange, true)

      return () => {
        document.removeEventListener('mousedown', handlePointerDown)
        window.removeEventListener('resize', handleViewportChange)
        window.removeEventListener('scroll', handleViewportChange, true)
      }
    }, [open, visibleMonth.year, visibleMonth.month])

    const nativeInputProps = isControlled
      ? { value: selectedValue }
      : { defaultValue: String(defaultValue ?? selectedValue) }

    const displayValue = selectedDate
      ? displayFormatter.format(selectedDate)
      : placeholder ?? t('selectDate', 'Select date')
    const describedBy = [error ? `${inputId}-error` : null, hint ? `${inputId}-hint` : null].filter(Boolean).join(' ') || undefined

    const picker = open && typeof document !== 'undefined'
      ? createPortal(
            <div
              ref={pickerRef}
              id={pickerId}
              className={cn(
              'z-[75] flex flex-col overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] dark:bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(15,23,42,0.94))] shadow-[0_34px_80px_-34px_rgba(15,23,42,0.8)] animate-modal-enter backdrop-blur',
              placement === 'top' ? 'origin-bottom' : 'origin-top'
            )}
            style={pickerStyle}
          >
            <div className="border-b border-[var(--color-border)] bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.2),transparent_55%),linear-gradient(180deg,rgba(17,24,39,0.98),rgba(15,23,42,0.92))] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                    {t('datePicker', 'Date picker')}
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {selectedDate ? displayFormatter.format(selectedDate) : t('selectDateHint', 'Choose the exact date you need.')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-muted)] transition-colors hover:border-primary-accent/40 hover:text-[var(--color-text)]"
                    onClick={() => setVisibleMonth((current) => shiftMonth(current, -1))}
                    aria-label={t('previousMonth', 'Previous month')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-muted)] transition-colors hover:border-primary-accent/40 hover:text-[var(--color-text)]"
                    onClick={() => setVisibleMonth((current) => shiftMonth(current, 1))}
                    aria-label={t('nextMonth', 'Next month')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-[1fr,120px]">
                <Select
                  aria-label={t('month', 'Month')}
                  value={String(visibleMonth.month)}
                  options={monthSelectOptions}
                  menuPortalScope={pickerId}
                  menuClassName="z-[85]"
                  className="min-h-[42px] text-sm"
                  onChange={(event) =>
                    setVisibleMonth((current) => ({ ...current, month: Number(event.target.value) }))
                  }
                />
                <Select
                  aria-label={t('year', 'Year')}
                  value={String(visibleMonth.year)}
                  options={yearSelectOptions}
                  menuPortalScope={pickerId}
                  menuClassName="z-[85]"
                  className="min-h-[42px] text-sm"
                  onChange={(event) =>
                    setVisibleMonth((current) => ({ ...current, year: Number(event.target.value) }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3 overflow-y-auto p-4 touch-pan-y">
              <div className="grid grid-cols-7 gap-1">
                {weekdayLabels.map((weekday) => (
                  <div
                    key={weekday}
                    className="flex h-9 items-center justify-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]"
                  >
                    {weekday}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const isSelected = day.value === selectedValue
                  return (
                    <button
                      key={day.key}
                      type="button"
                      className={cn(
                        'flex h-11 items-center justify-center rounded-[18px] text-sm font-medium transition-all duration-150',
                        day.disabled && 'cursor-not-allowed text-[var(--color-text-muted)]/35',
                        !day.disabled && !isSelected && day.inCurrentMonth && 'text-[var(--color-text)] hover:bg-primary-accent/10',
                        !day.disabled && !isSelected && !day.inCurrentMonth && 'text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/45',
                        isSelected && 'bg-primary-accent text-white shadow-[0_18px_34px_-22px_rgba(132,204,22,0.85)]',
                        day.isToday && !isSelected && 'border border-primary-accent/35'
                      )}
                      disabled={day.disabled}
                      aria-pressed={isSelected}
                      onClick={() => selectDate(day.value)}
                    >
                      {day.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-[var(--color-border)] bg-[var(--color-card)]/85 px-4 py-3">
              <div className="text-xs text-[var(--color-text-muted)]">
                {selectedValue || t('noDateSelected', 'No date selected')}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:border-primary-accent/40 hover:text-[var(--color-text)]"
                  onClick={clearValue}
                  disabled={disabled || !selectedValue}
                >
                  {t('clear', 'Clear')}
                </button>
                <button
                  type="button"
                  className="rounded-full bg-primary-accent px-3 py-1.5 text-sm font-medium text-white shadow-[0_18px_34px_-22px_rgba(132,204,22,0.85)] transition-transform hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  onClick={selectToday}
                  disabled={disabled || !isWithinRange(toDateValue(getToday()), minValue, maxValue)}
                >
                  {t('today', 'Today')}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-[var(--color-text)]">
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={syncExternalRef}
            id={`${inputId}-native`}
            type="date"
            name={name}
            min={minValue}
            max={maxValue}
            disabled={disabled}
            tabIndex={-1}
            aria-hidden
            className="pointer-events-none absolute h-0 w-0 opacity-0"
            onChange={onChange}
            onBlur={onBlur}
            {...nativeInputProps}
            {...rest}
          />

          <button
            ref={triggerRef}
            id={inputId}
            type="button"
            className={cn(
              'group relative flex min-h-[44px] w-full items-center overflow-hidden rounded-input border px-3 py-2.5 text-left transition-all duration-200',
              'bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] dark:bg-[linear-gradient(180deg,rgba(17,24,39,0.96),rgba(15,23,42,0.92))] text-[var(--color-text)] shadow-[0_16px_34px_-28px_rgba(15,23,42,0.7)]',
              'hover:border-primary-accent/45 hover:shadow-[0_22px_42px_-30px_rgba(14,165,233,0.45)]',
              'focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-0',
              !error && !success && !open && 'border-[var(--color-border)]',
              success && 'border-green-500',
              error && 'border-red-500 focus:ring-red-500',
              open && 'border-primary-accent/60 ring-2 ring-primary-accent/15',
              disabled && 'cursor-not-allowed opacity-60 shadow-none',
              className
            )}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={open ? pickerId : undefined}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            disabled={disabled}
            onClick={() => (open ? closePicker() : openPicker())}
            onBlur={() => {
              window.setTimeout(() => {
                const activeElement = document.activeElement
                if (activeElement && (triggerRef.current?.contains(activeElement) || pickerRef.current?.contains(activeElement))) return
                closePicker()
                emitBlur()
              }, 0)
            }}
          >
            {left ? <span className="mr-2 flex items-center text-[var(--color-text-muted)]">{left}</span> : null}
            <span className={cn('min-w-0 flex-1 truncate pr-3 text-sm', !selectedValue && 'text-[var(--color-text-muted)]')}>
              {displayValue}
            </span>
            <span className="flex items-center gap-1">
              {selectedValue && !disabled ? (
                <span
                  role="button"
                  tabIndex={-1}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-border)] hover:text-[var(--color-text)]"
                  onClick={(event) => {
                    event.stopPropagation()
                    clearValue()
                  }}
                  aria-label={t('clear', 'Clear')}
                >
                  <X className="h-4 w-4" />
                </span>
              ) : null}
              {right ?? (
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/90 text-[var(--color-text-muted)] transition-all duration-200',
                    open && 'border-primary-accent/45 bg-primary-accent/12 text-primary-accent'
                  )}
                >
                  <CalendarDays className="h-4 w-4" />
                </span>
              )}
            </span>
          </button>
        </div>

        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-500">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {hint}
          </p>
        )}
        {picker}
      </div>
    )
  }
)
