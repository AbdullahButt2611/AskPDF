import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react'
import { useEffect, useState } from 'react'

import { AmbientBackground } from '@/components/brand/AmbientBackground'
import ShinyText from '@/components/reactbits/ShinyText'

import { SplashMark } from './SplashMark'

const EASE_OUT = [0.23, 1, 0.32, 1] as const
const PAGE_LIFT = [0.76, 0, 0.24, 1] as const
const STATUS_MESSAGES = ['Opening your library', 'Gathering your pages', 'Almost ready']
const STATUS_INTERVAL_MS = 700
const WORDMARK = [
  { text: 'Ask', highlighted: false },
  { text: 'PDF', highlighted: true },
]

// The exit runs as one sequence: the progress line completes, then the whole screen lifts away like a page
const screenVariants: Variants = {
  visible: { y: 0 },
  exit: { y: '-100%', transition: { delay: 0.3, duration: 0.75, ease: PAGE_LIFT } },
}
const progressVariants: Variants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 0.85, transition: { duration: 1.9, ease: [0.4, 0, 0.2, 1] } },
  exit: { scaleX: 1, transition: { duration: 0.3, ease: EASE_OUT } },
}

export function SplashScreen() {
  const isStatic = useReducedMotion() ?? false
  const [statusIndex, setStatusIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(
      () => setStatusIndex((index) => Math.min(index + 1, STATUS_MESSAGES.length - 1)),
      STATUS_INTERVAL_MS,
    )
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-bg px-6"
      variants={isStatic ? undefined : screenVariants}
      initial="hidden"
      animate="visible"
      exit={isStatic ? { opacity: 0 } : 'exit'}
      role="status"
      aria-label="Loading AskPDF"
    >
      <AmbientBackground />

      <SplashMark className="h-32 w-auto sm:h-36" />

      <p className="mt-6 flex font-display text-5xl tracking-[-0.03em] sm:text-6xl" aria-label="AskPDF">
        {WORDMARK.map(({ text, highlighted }, partIndex) => (
          <span
            key={text}
            aria-hidden="true"
            className={highlighted ? 'relative isolate ml-[0.04em] px-[0.08em] text-on-accent' : undefined}
          >
            {highlighted && (
              <motion.span
                className="absolute inset-x-0 top-[0.16em] bottom-[0.06em] -z-10 origin-left -rotate-[1.5deg] rounded-[0.16em] bg-accent"
                initial={{ scaleX: isStatic ? 1 : 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: isStatic ? 0 : 1.45, duration: 0.5, ease: EASE_OUT }}
              />
            )}
            {text.split('').map((letter, letterIndex) => (
              <span key={letterIndex} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <motion.span
                  className="inline-block"
                  initial={{ y: isStatic ? 0 : '110%', opacity: isStatic ? 0 : 1 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: isStatic ? 0 : 0.9 + (partIndex * 3 + letterIndex) * 0.06,
                    duration: 0.6,
                    ease: EASE_OUT,
                  }}
                >
                  {letter}
                </motion.span>
              </span>
            ))}
          </span>
        ))}
      </p>

      <div className="mt-8 flex flex-col items-center gap-3">
        <div className="h-5 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={statusIndex}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
            >
              <ShinyText
                text={STATUS_MESSAGES[statusIndex]}
                speed={1.6}
                className="font-label text-[11px] font-semibold tracking-[0.16em] uppercase"
              />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="h-[3px] w-48 overflow-hidden rounded-full bg-border">
          <motion.div
            variants={progressVariants}
            initial={isStatic ? false : undefined}
            className="h-full origin-left rounded-full bg-primary dark:bg-accent"
          />
        </div>
      </div>

      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-accent" />
    </motion.div>
  )
}
