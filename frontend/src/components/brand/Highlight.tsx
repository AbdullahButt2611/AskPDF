import { motion, useReducedMotion } from 'motion/react'

/** A word swiped with a lime highlighter, like marking up a printed page. */
export function Highlight({ children, delay = 0.7 }: { children: string; delay?: number }) {
  const isStatic = useReducedMotion() ?? false
  return (
    <span className="relative isolate inline-block px-[0.08em] text-on-accent">
      <motion.span
        aria-hidden="true"
        className="absolute inset-x-0 top-[0.16em] bottom-[0.04em] -z-10 origin-left -rotate-[1.5deg] rounded-[0.18em] bg-accent"
        initial={{ scaleX: isStatic ? 1 : 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: isStatic ? 0 : delay, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      />
      {children}
    </span>
  )
}
