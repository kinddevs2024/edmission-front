import { type ReactNode } from 'react'
import { useTilt } from '@/hooks/useTilt'
import { cn } from '@/utils/cn'

interface TiltCardProps {
  children: ReactNode
  className?: string
  maxTilt?: number
  perspective?: number
}

/**
 * Wraps content in a container that tilts in 3D toward the cursor.
 * On touch devices the effect is disabled.
 */
export function TiltCard({
  children,
  className,
  maxTilt = 10,
  perspective = 1000,
}: TiltCardProps) {
  const { ref, style, onMouseMove, onMouseLeave } = useTilt({
    maxTilt,
    perspective,
    disableOnTouch: true,
  })

  return (
    <div
      ref={ref}
      className={cn('transition-transform duration-150 ease-out', className)}
      style={style}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  )
}
