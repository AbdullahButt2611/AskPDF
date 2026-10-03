import { motion } from 'motion/react'

import { ReadingMark } from '@/components/brand/ReadingMark'
import BlurText from '@/components/reactbits/BlurText'
import LatticeLoader from '@/components/reactbits/LatticeLoader'
import ShinyText from '@/components/reactbits/ShinyText'

export function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 overflow-hidden bg-bg px-6"
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      role="status"
      aria-label="Loading AskPDF"
    >
      <motion.div
        aria-hidden="true"
        className="absolute size-[32rem] rounded-full bg-accent opacity-25 blur-[120px] dark:bg-brand-offwhite dark:opacity-[0.07]"
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      >
        <ReadingMark className="relative h-28 w-auto" />
      </motion.div>

      <div className="relative flex flex-col items-center gap-3 text-center">
        <BlurText
          text="AskPDF"
          animateBy="letters"
          delay={70}
          className="justify-center font-display text-5xl tracking-tight sm:text-6xl"
        />
        <ShinyText text="Answers grounded in your own documents" speed={2.4} className="text-base sm:text-lg" />
      </div>

      <LatticeLoader
        label="Preparing your knowledge base"
        pattern="spiral"
        showTimer={false}
        fontSize={12}
        className="relative font-label font-semibold tracking-wide text-muted uppercase"
      />
    </motion.div>
  )
}
