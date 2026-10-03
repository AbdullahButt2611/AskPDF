import { AnimatePresence, motion } from 'motion/react'

import { ReadingMark } from '@/components/brand/ReadingMark'

/** Shown while a file is dragged over the welcome screen. */
export function DropOverlay({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none absolute inset-3 z-40 flex flex-col items-center justify-center gap-5 rounded-[2rem] border-2 border-dashed border-primary bg-bg/80 backdrop-blur-md"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        >
          <ReadingMark className="h-24 w-auto" />
          <p className="font-display text-3xl">Drop to Add It to Your Knowledge Base</p>
          <p className="font-label text-[11px] font-semibold tracking-wider text-subtle uppercase">PDF files only</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
