import { Monitor, Moon, Sun } from 'lucide-react'
import type { ReactNode } from 'react'

import { Logo } from '@/components/brand/Logo'
import { PageHeader } from '@/components/layout/PageHeader'
import RubberSegment from '@/components/reactbits/RubberSegment'
import {
  PASSAGE_COUNT_OPTIONS,
  usePreferencesStore,
  type PassageCount,
  type ThemePreference,
} from '@/features/preferences/preferences-store'

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: <Sun className="size-4" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="size-4" /> },
  { value: 'system', label: 'System', icon: <Monitor className="size-4" /> },
] satisfies { value: ThemePreference; label: string; icon: ReactNode }[]

export function SettingsPage() {
  const { theme, setTheme, passagesPerAnswer, setPassagesPerAnswer } = usePreferencesStore()

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-10 sm:px-8">
        <PageHeader
          eyebrow="Settings"
          title="Preferences"
          description="Saved on this device and applied instantly."
        />

        <SettingsSection
          title="Appearance"
          description="Choose a theme, or follow your operating system's setting."
          preview={
            <div className="flex items-center justify-center rounded-2xl border border-border bg-bg px-6 py-5">
              <Logo className="h-9" />
            </div>
          }
        >
          <RubberSegment
            aria-label="Theme"
            items={THEME_OPTIONS}
            value={theme}
            onChange={(value) => setTheme(value as ThemePreference)}
            equalSlots
          />
        </SettingsSection>

        <SettingsSection
          title="Passages per Answer"
          description="How many passages from your documents each answer draws on. Fewer is faster and more focused; more gives broader answers."
        >
          <RubberSegment
            aria-label="Passages per answer"
            items={PASSAGE_COUNT_OPTIONS.map(String)}
            value={String(passagesPerAnswer)}
            onChange={(value) => setPassagesPerAnswer(Number(value) as PassageCount)}
            equalSlots
          />
        </SettingsSection>
      </div>
    </div>
  )
}

interface SettingsSectionProps {
  title: string
  description: string
  preview?: ReactNode
  children: ReactNode
}

function SettingsSection({ title, description, preview, children }: SettingsSectionProps) {
  return (
    <section className="rounded-card border border-border bg-surface p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-sm">
          <h2 className="text-lg">{title}</h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        {children}
      </div>
      {preview && <div className="mt-5">{preview}</div>}
    </section>
  )
}
