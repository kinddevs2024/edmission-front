import { useMemo } from 'react'
import { Chip } from '@material-tailwind/react'
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
            className="p-0 border-0 bg-transparent cursor-pointer"
          >
            <Chip
              value={opt}
              variant={selectedSet.has(opt) ? 'filled' : 'outlined'}
              color="green"
              className={cn(
                'transition-all pointer-events-none',
                selectedSet.has(opt) && '!bg-primary-accent/90 !text-primary-dark !border-primary-accent'
              )}
            />
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
