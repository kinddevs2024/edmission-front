import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

type SwitchProps = Omit<React.ComponentProps<'button'>, 'type' | 'role' | 'aria-checked' | 'children'> & {
  checked: boolean
  tone?: 'primary' | 'warning'
  label?: string
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  function Switch({ checked, tone = 'primary', label, className, disabled, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition-colors duration-200',
          'shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked
            ? tone === 'warning' ? 'bg-amber-500' : 'bg-primary-accent'
            : 'bg-[var(--color-border)]',
          className
        )}
        {...props}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 rounded-full transition-transform duration-200',
            'border border-t-white/80 border-x-gray-200 border-b-gray-300 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2),0_1px_0_rgba(0,0,0,0.1)]',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    )
  }
)
