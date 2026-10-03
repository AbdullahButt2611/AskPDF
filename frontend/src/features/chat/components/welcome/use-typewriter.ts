import { useEffect, useState } from 'react'

const TYPE_MS = 38
const ERASE_MS = 18
const HOLD_MS = 2200

/**
 * Types each phrase out, holds it, erases it and moves to the next. Returns the visible text and the full phrase
 * it belongs to. Pauses while `active` is false (e.g. once the user starts typing).
 */
export function useTypewriter(phrases: string[], active: boolean) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [length, setLength] = useState(0)
  const [erasing, setErasing] = useState(false)
  const phrase = phrases[phraseIndex % Math.max(phrases.length, 1)] ?? ''

  useEffect(() => {
    if (!active || !phrase) return
    const isFullyTyped = length === phrase.length
    const delay = erasing ? ERASE_MS : isFullyTyped ? HOLD_MS : TYPE_MS
    const timeout = setTimeout(() => {
      if (erasing) {
        if (length === 0) {
          setErasing(false)
          setPhraseIndex((index) => index + 1)
        } else {
          setLength(length - 1)
        }
      } else if (isFullyTyped) {
        setErasing(true)
      } else {
        setLength(length + 1)
      }
    }, delay)
    return () => clearTimeout(timeout)
  }, [active, phrase, length, erasing])

  return { text: phrase.slice(0, length), phrase }
}
