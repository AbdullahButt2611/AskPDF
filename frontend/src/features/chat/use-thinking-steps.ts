import { useEffect, useState } from 'react'

import { pluralize } from '@/lib/format'

// When each step appears. The backend answers in one request, so these mirror its real phases
// (embed, search, read, generate) on a timeline rather than reporting live progress.
const STEP_START_TIMES_MS = [0, 1400, 3800, 7200]

function buildThinkingSteps(documentCount: number) {
  return [
    'Understanding your question',
    `Searching ${pluralize(documentCount, 'document')}`,
    'Reading the most relevant passages',
    'Writing your answer',
  ]
}

/** Steps revealed so far for an answer that started at `startedAt`. Re-renders only when a new step is due. */
export function useThinkingSteps(startedAt: number, documentCount: number) {
  const [now, setNow] = useState(Date.now)
  const elapsedMs = now - startedAt
  const nextStepAt = STEP_START_TIMES_MS.find((startTime) => startTime > elapsedMs)

  useEffect(() => {
    if (nextStepAt === undefined) return
    const timeout = setTimeout(() => setNow(Date.now()), nextStepAt - elapsedMs)
    return () => clearTimeout(timeout)
  }, [nextStepAt, elapsedMs])

  const revealedCount = STEP_START_TIMES_MS.filter((startTime) => startTime <= elapsedMs).length
  return buildThinkingSteps(documentCount).slice(0, revealedCount)
}
