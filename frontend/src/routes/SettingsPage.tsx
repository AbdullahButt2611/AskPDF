import { Check, Cpu, Monitor, Moon, RotateCcw, Sun, type LucideIcon } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { useState, type ReactNode } from 'react'

import { AmbientBackground } from '@/components/brand/AmbientBackground'
import { Highlight } from '@/components/brand/Highlight'
import { PassageOption } from '@/features/preferences/components/PassageOption'
import { ThemeOption } from '@/features/preferences/components/ThemeOption'
import {
  DEFAULT_PREFERENCES,
  usePreferencesStore,
  type PassageCount,
  type ThemePreference,
} from '@/features/preferences/preferences-store'

const EASE_OUT = [0.23, 1, 0.32, 1] as const

const THEME_OPTIONS: { value: ThemePreference; label: string; description: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', description: 'Bright off-white pages with teal ink.', icon: Sun },
  { value: 'dark', label: 'Dark', description: 'Deep teal with lime accents, easy at night.', icon: Moon },
  { value: 'system', label: 'System', description: 'Follows your device and switches automatically.', icon: Monitor },
]

const PASSAGE_OPTIONS: { value: PassageCount; label: string; description: string; recommended?: boolean }[] = [
  { value: 3, label: 'Fastest', description: 'Quick, focused answers from the closest matches.' },
  { value: 5, label: 'Balanced', description: 'A good mix of speed and coverage for most questions.', recommended: true },
  { value: 8, label: 'Thorough', description: 'Reads more widely; better for detailed questions.' },
  { value: 12, label: 'Broadest', description: 'Covers the most ground, but answers take longer.' },
]

export function SettingsPage() {
  const isStatic = useReducedMotion() ?? false
  const { theme, setTheme, passagesPerAnswer, setPassagesPerAnswer, reset } = usePreferencesStore()
  // Bumped on every change; used as a key so the "Saved" confirmation replays without a timer effect
  const [saveCount, setSaveCount] = useState(0)

  const isDefault = theme === DEFAULT_PREFERENCES.theme && passagesPerAnswer === DEFAULT_PREFERENCES.passagesPerAnswer
  const save = (apply: () => void) => {
    apply()
    setSaveCount((count) => count + 1)
  }

  const rise: Variants = {
    hidden: isStatic ? { opacity: 0 } : { opacity: 0, y: 20, filter: 'blur(6px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: EASE_OUT } },
  }

  return (
    <div className="relative isolate h-full">
      <AmbientBackground />
      {/* Only this inner element scrolls, so the background and drop overlay always cover the visible area */}
      <div className="h-full overflow-y-auto">

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: isStatic ? 0 : 0.08 } } }}
          className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-5 py-10 sm:px-8 lg:px-10 lg:py-14"
        >
          <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <motion.p variants={rise} className="font-label text-[11px] font-semibold tracking-[0.14em] text-subtle uppercase">
                Settings
              </motion.p>
              <motion.h1
                variants={rise}
                className="mt-3 font-display text-[clamp(2rem,3.4vw,3rem)] leading-[1.05] tracking-[-0.03em]"
              >
                Make AskPDF <Highlight delay={isStatic ? 0 : 0.6}>Yours.</Highlight>
              </motion.h1>
              <motion.p variants={rise} className="mt-4 max-w-lg text-base leading-relaxed text-muted">
                Every change applies instantly and is saved on this device.
              </motion.p>
            </div>

            <motion.div variants={rise} className="flex items-center gap-3 sm:flex-row-reverse">
              <button
                type="button"
                onClick={() => save(reset)}
                disabled={isDefault}
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border-strong bg-surface/80 px-4 text-sm font-semibold backdrop-blur transition-colors hover:border-primary disabled:cursor-default disabled:opacity-45 disabled:hover:border-border-strong"
              >
                <RotateCcw className="size-4" />
                Reset to Defaults
              </button>
              <span aria-live="polite" className="flex h-9 items-center">
                {saveCount > 0 && (
                  <motion.span
                    key={saveCount}
                    className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 font-label text-[11px] font-semibold tracking-wider text-text uppercase"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: [0, 1, 1, 0], y: [6, 0, 0, -4] }}
                    transition={{ duration: 2.4, times: [0, 0.12, 0.8, 1] }}
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                    Saved
                  </motion.span>
                )}
              </span>
            </motion.div>
          </header>

          <motion.div variants={rise}>
            <Section title="Appearance" description="Pick how AskPDF looks. Click a preview to switch instantly.">
              <div role="radiogroup" aria-label="Theme" className="grid gap-4 sm:grid-cols-3">
                {THEME_OPTIONS.map((option) => (
                  <ThemeOption
                    key={option.value}
                    {...option}
                    checked={theme === option.value}
                    onSelect={(value) => save(() => setTheme(value))}
                  />
                ))}
              </div>
            </Section>
          </motion.div>

          <motion.div variants={rise}>
            <Section
              title="Passages per Answer"
              description="How many passages from your documents each answer reads before replying."
            >
              <div role="radiogroup" aria-label="Passages per answer" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {PASSAGE_OPTIONS.map((option) => (
                  <PassageOption
                    key={option.value}
                    {...option}
                    checked={passagesPerAnswer === option.value}
                    onSelect={(value) => save(() => setPassagesPerAnswer(value))}
                  />
                ))}
              </div>
            </Section>
          </motion.div>

          <motion.div
            variants={rise}
            className="flex items-start gap-4 rounded-card border border-border bg-surface/70 p-5 backdrop-blur"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-muted">
              <Cpu className="size-4.5" />
            </span>
            <p className="text-sm leading-relaxed text-muted">
              <span className="font-semibold text-text">Everything stays on this machine.</span> Your preferences are saved
              in this browser, and your documents are read and answered by AI models running locally, not in the cloud.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl">{title}</h2>
      <p className="mt-1.5 mb-5 text-muted">{description}</p>
      {children}
    </section>
  )
}
