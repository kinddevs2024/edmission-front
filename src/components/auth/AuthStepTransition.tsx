import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

type AuthStepTransitionProps = {
  stepKey: string | number
  children: ReactNode
  className?: string
}

export function AuthStepTransition({ stepKey, children, className }: AuthStepTransitionProps) {
  return (
    <div className="relative">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={stepKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          className={className}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
