import { useSyncExternalStore } from 'react'

// Long enough for the intro animation to read as intentional instead of flashing past on fast loads
const MINIMUM_SPLASH_MS = 2100

let hasElapsed = false
const listeners = new Set<() => void>()

setTimeout(() => {
  hasElapsed = true
  listeners.forEach((listener) => listener())
}, MINIMUM_SPLASH_MS)

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** True once the splash screen has been visible for its minimum duration since the app started. */
export function useSplashMinimumElapsed() {
  return useSyncExternalStore(subscribe, () => hasElapsed)
}
