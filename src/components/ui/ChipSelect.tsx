import { useMemo } from 'react'
import { cn } from '@/utils/cn'

interface ChipSelectProps {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  max?: number
  placeholder?: string
  className?: string
}

export function ChipSelect({
  options,
  value,
  onChange,
  max = 50,
  placeholder,
  className,
}: ChipSelectProps) {
  const selectedSet = useMemo(() => new Set(value), [value])

  const toggle = (item: string) => {
    if (selectedSet.has(item)) {
      onChange(value.filter((s) => s !== item))
    } else if (value.length < max) {
      onChange([...value, item])
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {placeholder && <p className="text-sm text-[var(--color-text-muted)]">{placeholder}</p>}
      <div className="flex flex-wrap gap-2 max-h-[280px] overflow-y-auto p-1">
        {options.map((opt, i) => (
          <button
            key={`${opt}-${i}`}
            type="button"
            onClick={() => toggle(opt)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
              selectedSet.has(opt)
                ? 'bg-primary-accent/20 border-primary-accent text-primary-accent'
                : 'border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] hover:bg-[var(--color-bg)]'
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      {max > 0 && (
        <p className="text-xs text-[var(--color-text-muted)]">
          {value.length} / {max} selected
        </p>
      )}
    </div>
  )
}
