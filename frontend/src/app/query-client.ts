import { QueryClient } from '@tanstack/react-query'

import { ApiError } from '@/lib/api-client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      // Client errors (4xx) won't succeed on retry; network and server errors might
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
    },
  },
})
