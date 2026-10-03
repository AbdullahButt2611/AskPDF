import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'light' | 'dark' | 'system'

export const PASSAGE_COUNT_OPTIONS = [3, 5, 8, 12] as const
export type PassageCount = (typeof PASSAGE_COUNT_OPTIONS)[number]

interface PreferencesState {
  theme: ThemePreference
  passagesPerAnswer: PassageCount
  setTheme: (theme: ThemePreference) => void
  setPassagesPerAnswer: (count: PassageCount) => void
}

// The storage key is also read by the inline script in index.html to apply the theme before first paint
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'system',
      passagesPerAnswer: 5,
      setTheme: (theme) => set({ theme }),
      setPassagesPerAnswer: (passagesPerAnswer) => set({ passagesPerAnswer }),
    }),
    { name: 'askpdf-preferences' },
  ),
)

const darkSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)')

function applyTheme(theme: ThemePreference) {
  const isDark = theme === 'dark' || (theme === 'system' && darkSchemeQuery.matches)
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.classList.toggle('light', !isDark)
}

applyTheme(usePreferencesStore.getState().theme)
usePreferencesStore.subscribe((state, previous) => {
  if (state.theme !== previous.theme) applyTheme(state.theme)
})
darkSchemeQuery.addEventListener('change', () => applyTheme(usePreferencesStore.getState().theme))
