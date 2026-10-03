import { motion, useReducedMotion } from 'motion/react'
import { useId } from 'react'

// Same page silhouette as the AskPDF mark
const PAGE_PATH = 'M18 6H40L54 20V46A8 8 0 0 1 46 54H24L10 62V14A8 8 0 0 1 18 6Z'
const FOLD_PATH = 'M40 6V15A5 5 0 0 0 45 20H54Z'
const EASE_OUT = [0.23, 1, 0.32, 1] as const

// Where each sheet flies in from, and where it settles in the stack (front sheet last)
const SHEETS = [
  { from: { x: -70, y: 40, rotate: -38 }, to: { x: 13, y: -7, rotate: 13 }, opacity: 0.16, delay: 0 },
  { from: { x: 80, y: -50, rotate: 34 }, to: { x: 6.5, y: -3.5, rotate: 6 }, opacity: 0.32, delay: 0.08 },
  { from: { x: -20, y: 70, rotate: -16 }, to: { x: 0, y: 0, rotate: 0 }, opacity: 1, delay: 0.16 },
]
const TEXT_LINES = [
  { y: 25, width: 26 },
  { y: 33, width: 20 },
  { y: 41, width: 14 },
]

/** Three pages fly in and settle into the AskPDF mark, whose lines then write themselves and get scanned. */
export function SplashMark({ className }: { className?: string }) {
  const clipId = useId()
  const isStatic = useReducedMotion() ?? false

  return (
    <motion.svg
      viewBox="-6 -10 84 80"
      className={className}
      aria-hidden="true"
      animate={isStatic ? undefined : { y: [0, -3, 0] }}
      transition={{ duration: 3.2, delay: 1.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={PAGE_PATH} />
        </clipPath>
      </defs>

      {SHEETS.map((sheet, index) => {
        const isFront = index === SHEETS.length - 1
        return (
          <motion.g
            key={index}
            initial={isStatic ? { ...sheet.to, opacity: 0 } : { ...sheet.from, opacity: 0 }}
            animate={{ ...sheet.to, opacity: sheet.opacity }}
            transition={{ duration: isStatic ? 0.4 : 0.85, delay: isStatic ? 0 : sheet.delay, ease: EASE_OUT }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          >
            <path d={PAGE_PATH} fill="var(--primary)" />
            {isFront && (
              <>
                <motion.path
                  d={FOLD_PATH}
                  fill="var(--on-primary)"
                  initial={{ scale: isStatic ? 1 : 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: isStatic ? 0 : 0.8, type: 'spring', stiffness: 420, damping: 18 }}
                  style={{ transformBox: 'fill-box', transformOrigin: 'top right' }}
                />
                {TEXT_LINES.map((line, lineIndex) => (
                  <motion.rect
                    key={line.y}
                    x={18}
                    y={line.y}
                    width={line.width}
                    height={5}
                    rx={2.5}
                    fill="var(--on-primary)"
                    initial={{ scaleX: isStatic ? 1 : 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: isStatic ? 0 : 0.95 + lineIndex * 0.12, duration: 0.45, ease: EASE_OUT }}
                    style={{ transformBox: 'fill-box', originX: 0 }}
                  />
                ))}
                {!isStatic && (
                  <g clipPath={`url(#${clipId})`}>
                    <motion.rect
                      x={8}
                      width={48}
                      height={9}
                      fill="var(--on-primary)"
                      opacity={0.3}
                      initial={{ y: -10 }}
                      animate={{ y: [-10, 62] }}
                      transition={{ delay: 1.35, duration: 1.1, repeat: Infinity, repeatDelay: 0.9, ease: 'easeInOut' }}
                    />
                  </g>
                )}
              </>
            )}
          </motion.g>
        )
      })}
    </motion.svg>
  )
}
