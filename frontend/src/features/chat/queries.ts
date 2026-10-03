import { useMutation } from '@tanstack/react-query'

import { errorMessage } from '@/lib/api-client'
import { usePreferencesStore } from '@/features/preferences/preferences-store'

import { askQuestion } from './api'
import { useChatStore } from './chat-store'

interface AskVariables {
  answerId: string
  question: string
}

/**
 * Callbacks live on the mutation itself (not on `mutate`) so an answer still lands in the
 * conversation if the user navigates away while it is being generated.
 */
export function useAskQuestion() {
  const mutation = useMutation({
    mutationFn: ({ question }: AskVariables) =>
      askQuestion({ question, passageCount: usePreferencesStore.getState().passagesPerAnswer }),
    onSuccess: (answer, { answerId }) => useChatStore.getState().resolveAnswer(answerId, answer),
    onError: (error, { answerId, question }) =>
      useChatStore.getState().failAnswer(answerId, errorMessage(error), question),
  })

  const ask = (question: string) => {
    const answerId = useChatStore.getState().startExchange(question)
    mutation.mutate({ answerId, question })
  }

  const retry = (answerId: string, question: string) => {
    useChatStore.getState().retryAnswer(answerId)
    mutation.mutate({ answerId, question })
  }

  return { ask, retry }
}
