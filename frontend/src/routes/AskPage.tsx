import { SquarePen } from 'lucide-react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/Button'
import { AssistantMessage } from '@/features/chat/components/AssistantMessage'
import { ChatComposer } from '@/features/chat/components/ChatComposer'
import { ChatWelcome } from '@/features/chat/components/ChatWelcome'
import { selectIsAnswering, useChatStore } from '@/features/chat/chat-store'
import { useAskQuestion } from '@/features/chat/queries'
import { useDocuments } from '@/features/documents/queries'
import { usePreferencesStore } from '@/features/preferences/preferences-store'

export function AskPage() {
  const messages = useChatStore((state) => state.messages)
  const isAnswering = useChatStore(selectIsAnswering)
  const clearChat = useChatStore((state) => state.clear)
  const passagesPerAnswer = usePreferencesStore((state) => state.passagesPerAnswer)
  const { data: documents = [] } = useDocuments()
  const { ask, retry } = useAskQuestion()

  const hasReadyDocuments = documents.some((document) => document.status === 'ready')

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <Link
          to="/settings"
          className="rounded-full border border-border px-3 py-1 font-mono text-[11px] tracking-wider text-subtle uppercase transition-colors hover:border-border-strong hover:text-text"
        >
          {passagesPerAnswer} passages per answer
        </Link>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat} disabled={isAnswering}>
            <SquarePen className="size-4" />
            New chat
          </Button>
        )}
      </header>

      {/* column-reverse keeps the view pinned to the newest message natively as content grows */}
      <div className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto">
        {messages.length === 0 ? (
          <div className="my-auto">
            <ChatWelcome hasReadyDocuments={hasReadyDocuments} onAsk={ask} />
          </div>
        ) : (
          <ol className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-6" aria-label="Conversation">
            {messages.map((message) =>
              message.role === 'user' ? (
                <li key={message.id} className="flex justify-end">
                  <p className="max-w-[85%] rounded-[1.25rem] rounded-br-md bg-primary px-4 py-2.5 whitespace-pre-wrap text-on-primary">
                    {message.content}
                  </p>
                </li>
              ) : (
                <li key={message.id}>
                  <AssistantMessage message={message} onRetry={retry} />
                </li>
              ),
            )}
          </ol>
        )}
      </div>

      <div className="px-5 pt-2 pb-5 sm:px-8">
        <ChatComposer
          onSubmit={ask}
          disabled={isAnswering || !hasReadyDocuments}
          placeholder={hasReadyDocuments ? 'Ask a question about your documents…' : 'Upload a PDF to start asking…'}
        />
      </div>
    </div>
  )
}
