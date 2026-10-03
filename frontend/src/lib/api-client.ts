const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const DEFAULT_TIMEOUT_MS = 30_000

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface ApiRequestOptions extends Omit<RequestInit, 'signal'> {
  timeoutMs?: number
}

export async function apiRequest<T>(path: string, { timeoutMs = DEFAULT_TIMEOUT_MS, ...init }: ApiRequestOptions = {}) {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, signal: AbortSignal.timeout(timeoutMs) })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new ApiError('The request took too long. Please try again.', 0)
    }
    throw new ApiError("Can't reach the server. Make sure the backend is running.", 0)
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

async function readErrorMessage(response: Response) {
  try {
    const body: { detail?: unknown } = await response.json()
    if (typeof body.detail === 'string') return body.detail
  } catch {
    // The body isn't JSON; fall through to a generic message
  }
  return response.status === 422 ? 'Please check your input and try again.' : 'Something went wrong. Please try again.'
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}
