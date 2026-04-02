import { cn } from '@/utils/cn'

type BrandLogoProps = {
  className?: string
  imageClassName?: string
  mode?: 'auto' | 'light' | 'dark'
  alt?: string
}

export function BrandLogo({
  className,
  imageClassName,
  mode = 'auto',
  alt = 'Edmission',
}: BrandLogoProps) {
  const imgClass = cn('block h-8 w-auto', imageClassName)

  return (
    <span className={cn('inline-flex items-center', className)}>
      {mode === 'light' ? (
        <img src="/landing/edmission-logo.svg" alt={alt} className={imgClass} />
      ) : mode === 'dark' ? (
        <img src="/landing/edmission-logo-light.svg" alt={alt} className={imgClass} />
      ) : (
        <>
          <img src="/landing/edmission-logo.svg" alt={alt} className={cn(imgClass, 'dark:hidden')} />
          <img src="/landing/edmission-logo-light.svg" alt={alt} className={cn(imgClass, 'hidden dark:block')} />
        </>
      )}
    </span>
  )
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center justify-center', className)} aria-hidden>
      <svg viewBox="0 0 48 48" className="h-full w-full" xmlns="http://www.w3.org/2000/svg" fill="none">
        <rect width="48" height="48" rx="12" fill="#84CC16" />
        <path fill="#FFFFFF" d="M9 8L39 8 39 14 16 14 16 21 34 21 34 27 16 27 16 34 39 34 39 41 9 41z" />
      </svg>
    </span>
  )
}
