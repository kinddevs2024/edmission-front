import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

type AuthStepTransitionProps = {
  stepKey: string | number
  children: ReactNode
  className?: string
}

export function AuthStepTransition({ stepKey, children, className }: AuthStepTransitionProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, x: 20, scale: 0.985 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -20, scale: 0.985 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
