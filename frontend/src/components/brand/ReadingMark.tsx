import { motion, useReducedMotion } from 'motion/react'
import { useId } from 'react'

import { cn } from '@/lib/cn'

// Same page silhouette as the AskPDF mark
const PAGE_PATH = 'M18 6H40L54 20V46A8 8 0 0 1 46 54H24L10 62V14A8 8 0 0 1 18 6Z'
const FOLD_PATH = 'M40 6V15A5 5 0 0 0 45 20H54Z'
const TEXT_LINES = [
  { y: 25, width: 26 },
  { y: 33, width: 20 },
  { y: 41, width: 14 },
]
const PASSAGES = [
  { y: 22, delay: 0 },
  { y: 34, delay: 0.7 },
  { y: 46, delay: 1.4 },
]
const LOOP_SECONDS = 2.1

interface ReadingMarkProps {
  className?: string
}

/** The AskPDF page "reading" itself: lines fill in, a scan band sweeps down and passages are pulled out. */
export function ReadingMark({ className }: ReadingMarkProps) {
  const clipId = useId()
  const isStatic = useReducedMotion() ?? false
  const loop = (delay = 0) => ({ duration: LOOP_SECONDS, delay, repeat: Infinity, ease: 'easeInOut' as const })

  return (
    <svg viewBox="-2 0 80 68" className={cn('overflow-visible', className)} aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <path d={PAGE_PATH} />
        </clipPath>
      </defs>

      <motion.path
        d={PAGE_PATH}
        fill="var(--primary)"
        opacity={0.22}
        initial={{ x: 7, y: -3, rotate: 7 }}
        animate={isStatic ? undefined : { y: [-3, -6, -3], rotate: [7, 9, 7] }}
        transition={loop(0.35)}
        style={{ transformBox: 'fill-box', originX: 0.5, originY: 1 }}
      />

      <motion.g animate={isStatic ? undefined : { y: [0, -2.5, 0] }} transition={loop()}>
        <path d={PAGE_PATH} fill="var(--primary)" />
        <path d={FOLD_PATH} fill="var(--on-primary)" />

        {TEXT_LINES.map((line, index) => (
          <motion.rect
            key={line.y}
            x={18}
            y={line.y}
            width={line.width}
            height={5}
            rx={2.5}
            fill="var(--on-primary)"
            initial={{ scaleX: isStatic ? 1 : 0.15, opacity: isStatic ? 1 : 0.5 }}
            animate={isStatic ? undefined : { scaleX: [0.15, 1, 1, 0.15], opacity: [0.5, 1, 1, 0.5] }}
            transition={{ ...loop(index * 0.22), times: [0, 0.35, 0.75, 1] }}
            style={{ transformBox: 'fill-box', originX: 0 }}
          />
        ))}

        {!isStatic && (
          <g clipPath={`url(#${clipId})`}>
            <motion.rect
              x={8}
              width={48}
              height={7}
              fill="var(--on-primary)"
              opacity={0.28}
              animate={{ y: [2, 56, 2] }}
              transition={{ duration: LOOP_SECONDS * 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </g>
        )}
      </motion.g>

      {!isStatic &&
        PASSAGES.map((passage) => (
          <motion.rect
            key={passage.y}
            x={50}
            y={passage.y}
            width={9}
            height={4}
            rx={2}
            fill="var(--primary)"
            initial={{ opacity: 0 }}
            animate={{ x: [0, 22], opacity: [0, 1, 0], scale: [0.6, 1, 0.8] }}
            transition={{ duration: LOOP_SECONDS, delay: passage.delay, repeat: Infinity, ease: 'easeOut' }}
            style={{ transformBox: 'fill-box', originX: 0.5, originY: 0.5 }}
          />
        ))}
    </svg>
  )
}
