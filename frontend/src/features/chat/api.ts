import { apiRequest } from '@/lib/api-client'

// Longer than the backend's own 120s answer timeout so its error message reaches the user
const QUERY_TIMEOUT_MS = 150_000

export interface Answer {
  answer: string
  sources: string[]
  passageCount: number
}

interface AnswerPayload {
  answer: string
  sources: string[]
  num_contexts: number
}

export async function askQuestion({ question, passageCount }: { question: string; passageCount: number }) {
  const payload = await apiRequest<AnswerPayload>('/api/queries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, top_k: passageCount }),
    timeoutMs: QUERY_TIMEOUT_MS,
  })
  return { answer: payload.answer, sources: payload.sources, passageCount: payload.num_contexts } satisfies Answer
}
