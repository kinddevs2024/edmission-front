import { useRef, useCallback, useState } from 'react'

const DEFAULT_MAX_TILT = 12
const DEFAULT_PERSPECTIVE = 800

interface UseTiltOptions {
  /** Max rotation in degrees (X and Y) */
  maxTilt?: number
  /** CSS perspective value (px) */
  perspective?: number
  /** Disable on touch devices to avoid jank */
  disableOnTouch?: boolean
}

/**
 * Returns ref and style for a 3D tilt effect that follows the mouse.
 * Attach ref to the element and spread style onto the same element.
 */
export function useTilt(options: UseTiltOptions = {}) {
  const {
    maxTilt = DEFAULT_MAX_TILT,
    perspective = DEFAULT_PERSPECTIVE,
    disableOnTouch = true,
  } = options

  const ref = useRef<HTMLDivElement>(null)
  const [isTouch] = useState(() =>
    typeof navigator !== 'undefined' && 'ontouchstart' in navigator
  )
  const disabled = disableOnTouch && isTouch

  const [style, setStyle] = useState<React.CSSProperties>({
    transformStyle: 'preserve-3d',
    perspective,
    willChange: 'transform',
  })

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled || !ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const percentX = (clientX - centerX) / (rect.width / 2)
      const percentY = (clientY - centerY) / (rect.height / 2)
      const rotateY = percentX * maxTilt
      const rotateX = -percentY * maxTilt
      setStyle((s) => ({
        ...s,
        transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      }))
    },
    [disabled, maxTilt, perspective]
  )

  const handleLeave = useCallback(() => {
    if (disabled) return
    setStyle((s) => ({
      ...s,
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
    }))
  }, [disabled, perspective])

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => handleMove(e.clientX, e.clientY),
    [handleMove]
  )

  return { ref, style, onMouseMove, onMouseLeave: handleLeave }
}
