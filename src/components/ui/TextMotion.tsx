import { animate, motion, useInView, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useRef } from 'react'
import { cn } from '@/utils/cn'

type TextMotionProps = {
  text: string
  className?: string
  delay?: number
}

export function TextGenerateEffect({ text, className, delay = 0 }: TextMotionProps) {
  const reduceMotion = useReducedMotion()
  const words = useMemo(() => text.trim().split(/\s+/), [text])

  return (
    <span className={cn('inline', className)} aria-label={text}>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          aria-hidden="true"
          className="inline-block"
          initial={reduceMotion ? false : { opacity: 0, y: '0.55em', filter: 'blur(6px)' }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.7 }}
          transition={{ duration: 0.48, delay: delay + index * 0.055, ease: [0.22, 1, 0.36, 1] }}
        >
          {word}
          {index < words.length - 1 ? '\u00a0' : ''}
        </motion.span>
      ))}
    </span>
  )
}

export function IrisText({ text, className, delay = 0 }: TextMotionProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.span
      className={cn('inline-block', className)}
      initial={reduceMotion ? false : { clipPath: 'circle(0% at 50% 50%)', opacity: 0 }}
      whileInView={reduceMotion ? undefined : { clipPath: 'circle(150% at 50% 50%)', opacity: 1 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {text}
    </motion.span>
  )
}

export function ColourfulText({ text, className }: Omit<TextMotionProps, 'delay'>) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.span
      className={cn(
        'inline-block bg-[linear-gradient(100deg,#ffffff_0%,#84e500_50%,#ffffff_100%)] bg-clip-text text-transparent',
        className,
      )}
      style={{ backgroundSize: '220% 100%' }}
      animate={reduceMotion ? undefined : { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    >
      {text}
    </motion.span>
  )
}

export function KerningText({ text, className, delay = 0 }: TextMotionProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.span
      className={cn('inline-block', className)}
      initial={reduceMotion ? false : { letterSpacing: '0.08em', opacity: 0 }}
      whileInView={reduceMotion ? undefined : { letterSpacing: '0em', opacity: 1 }}
      viewport={{ once: true, amount: 0.75 }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {text}
    </motion.span>
  )
}

function parseNumberLabel(label: string) {
  const firstDigit = label.search(/\d/)
  if (firstDigit === -1) return null
  let lastDigit = firstDigit
  for (let index = firstDigit + 1; index < label.length; index += 1) {
    if (/\d/.test(label[index])) lastDigit = index
  }
  const numeric = Number(label.slice(firstDigit, lastDigit + 1).replace(/\D/g, ''))
  if (!Number.isFinite(numeric)) return null
  return {
    prefix: label.slice(0, firstDigit),
    value: numeric,
    suffix: label.slice(lastDigit + 1),
  }
}

export function CountingNumber({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduceMotion = useReducedMotion()
  const inView = useInView(ref, { once: true, amount: 0.65 })
  const parsed = useMemo(() => parseNumberLabel(value), [value])

  useEffect(() => {
    if (!ref.current || !parsed || !inView || reduceMotion) return
    const formatter = new Intl.NumberFormat(document.documentElement.lang || undefined, {
      maximumFractionDigits: 0,
    })
    const controls = animate(0, parsed.value, {
      duration: 1.25,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        if (ref.current) {
          ref.current.textContent = `${parsed.prefix}${formatter.format(Math.round(latest))}${parsed.suffix}`
        }
      },
    })
    return () => controls.stop()
  }, [inView, parsed, reduceMotion])

  return (
    <span ref={ref} className={className} aria-label={value}>
      {value}
    </span>
  )
}

export function TypingIndicatorText({ label, className }: { label: string; className?: string }) {
  const reduceMotion = useReducedMotion()

  return (
    <span className={cn('inline-flex items-center gap-2', className)} role="status" aria-live="polite">
      <span>{label}</span>
      <span className="inline-flex items-center gap-1" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className="h-1 w-1 rounded-full bg-current"
            animate={reduceMotion ? undefined : { y: [0, -3, 0], opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.14, ease: 'easeInOut' }}
          />
        ))}
      </span>
    </span>
  )
}

const statusTone = {
  ok: 'bg-emerald-500',
  checking: 'bg-sky-500',
  error: 'bg-amber-500',
} as const

export function StatusPulseText({
  label,
  status,
  className,
}: {
  label: string
  status: keyof typeof statusTone
  className?: string
}) {
  const reduceMotion = useReducedMotion()

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
        {reduceMotion ? null : (
          <motion.span
            className={cn('absolute inset-0 rounded-full', statusTone[status])}
            animate={{ scale: [1, 1.9], opacity: [0.45, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <span className={cn('relative h-2.5 w-2.5 rounded-full', statusTone[status])} />
      </span>
      <span>{label}</span>
    </span>
  )
}
