import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

type CheckboxProps = Omit<React.ComponentProps<'input'>, 'type' | 'size'> & {
  label?: React.ReactNode
  color?: 'blue' | 'red' | 'green' | 'amber' | 'teal' | 'indigo' | 'purple' | 'pink' | 'gray'
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, color = 'green', className, ...props }, ref) {
    return (
      <label className={cn('flex w-full max-w-full items-center gap-2 cursor-pointer group', className)}>
        <span className="relative inline-flex shrink-0 w-5 h-5">
          <input
            ref={ref}
            type="checkbox"
            className="peer sr-only"
            {...props}
          />
          <span
            className={cn(
              'absolute inset-0 rounded border-2 border-[var(--color-border)] bg-[var(--color-card)]',
              'transition-colors duration-200',
              'group-hover:border-[var(--color-text-muted)]',
              'peer-checked:bg-primary-accent peer-checked:border-primary-accent',
              'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary-accent peer-focus-visible:ring-offset-2',
              'peer-disabled:opacity-50 peer-disabled:pointer-events-none'
            )}
          />
          <svg
            className="absolute inset-0 w-5 h-5 text-primary-dark opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none p-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
        {label != null && <span className="min-w-0 flex-1 text-sm text-[var(--color-text)] select-none">{label}</span>}
      </label>
    )
  }
)
