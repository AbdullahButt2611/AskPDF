import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router/dom'
import { Toaster } from 'sonner'

import { usePreferencesStore } from '@/features/preferences/preferences-store'

import { queryClient } from './query-client'
import { router } from './router'

export function App() {
  const theme = usePreferencesStore((state) => state.theme)

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        theme={theme}
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: '!rounded-card !border-border !bg-surface !text-text !font-sans !shadow-lg',
            description: '!text-muted',
          },
        }}
      />
    </QueryClientProvider>
  )
}
