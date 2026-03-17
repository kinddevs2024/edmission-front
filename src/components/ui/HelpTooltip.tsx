import { useId, useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { cn } from '@/utils/cn'

export function HelpTooltip({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const tooltipId = useId()

  return (
    <div
      className={cn('relative flex items-center', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-amber-500 transition-colors hover:bg-amber-500/10 hover:text-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent"
        aria-label={content}
        aria-describedby={open ? tooltipId : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((value) => !value)}
      >
        <CircleAlert className="h-4 w-4" aria-hidden />
      </button>
      {open ? (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[80] w-64 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-left text-xs leading-5 text-[var(--color-text-muted)] shadow-[0_24px_50px_-24px_rgba(15,23,42,0.45)] animate-modal-enter"
        >
          {content}
        </div>
      ) : null}
    </div>
  )
}
