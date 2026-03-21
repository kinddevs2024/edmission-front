import { type ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface TableProps {
  children: ReactNode
  className?: string
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-card border border-[var(--color-border)]">
      <table className={cn('w-full text-sm', className)}>{children}</table>
    </div>
  )
}

export function TableHead({ children, className }: TableProps) {
  return <thead className={cn('bg-[var(--color-border)]/30', className)}>{children}</thead>
}

export function TableBody({ children }: TableProps) {
  return <tbody>{children}</tbody>
}

export function TableRow({ children, className }: TableProps) {
  return (
    <tr className={cn('border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-border)]/10', className)}>
      {children}
    </tr>
  )
}

export function TableTh({ children, className }: TableProps) {
  return (
    <th className={cn('px-4 py-3 text-left font-medium text-[var(--color-text)]', className)}>
      {children}
    </th>
  )
}

export function TableTd({ children, className }: TableProps) {
  return <td className={cn('px-4 py-3 text-[var(--color-text)]', className)}>{children}</td>
}

interface PaginationProps {
  page: number
  total: number
  limit: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, total, limit, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  return (
    <div className="flex items-center justify-between gap-4 mt-4">
      <p className="text-sm text-[var(--color-text-muted)]">
        Page {page} of {totalPages} ({total} total)
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 rounded-input border border-[var(--color-border)] disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1 rounded-input border border-[var(--color-border)] disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}
