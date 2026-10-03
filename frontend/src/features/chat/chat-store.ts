import { create } from 'zustand'

import type { Answer } from './api'

export interface UserMessage {
  id: string
  role: 'user'
  content: string
}

export type AssistantMessage =
  | { id: string; role: 'assistant'; status: 'pending'; startedAt: number }
  | { id: string; role: 'assistant'; status: 'answered'; answer: Answer; thinkingSeconds: number }
  | { id: string; role: 'assistant'; status: 'failed'; error: string; question: string }

export type ChatMessage = UserMessage | AssistantMessage

interface ChatState {
  messages: ChatMessage[]
  /** Adds the question and a pending answer; returns the pending answer's id. */
  startExchange: (question: string) => string
  resolveAnswer: (id: string, answer: Answer) => void
  failAnswer: (id: string, error: string, question: string) => void
  retryAnswer: (id: string) => void
  clear: () => void
}

export const selectIsAnswering = (state: ChatState) =>
  state.messages.some((message) => message.role === 'assistant' && message.status === 'pending')

export const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  startExchange: (question) => {
    const answerId = crypto.randomUUID()
    set((state) => ({
      messages: [
        ...state.messages,
        { id: crypto.randomUUID(), role: 'user', content: question },
        { id: answerId, role: 'assistant', status: 'pending', startedAt: Date.now() },
      ],
    }))
    return answerId
  },
  resolveAnswer: (id, answer) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id && message.role === 'assistant' && message.status === 'pending'
          ? {
              id,
              role: 'assistant',
              status: 'answered',
              answer,
              thinkingSeconds: (Date.now() - message.startedAt) / 1000,
            }
          : message,
      ),
    })),
  failAnswer: (id, error, question) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id ? { id, role: 'assistant', status: 'failed', error, question } : message,
      ),
    })),
  retryAnswer: (id) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id ? { id, role: 'assistant', status: 'pending', startedAt: Date.now() } : message,
      ),
    })),
  clear: () => set({ messages: [] }),
}))
