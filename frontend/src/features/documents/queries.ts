import { useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query'

import { deleteDocument, fetchDocuments, uploadDocument, type KnowledgeDocument } from './api'

const PROCESSING_POLL_INTERVAL_MS = 2000

export const documentKeys = {
  all: ['documents'] as const,
  upload: ['documents', 'upload'] as const,
  delete: ['documents', 'delete'] as const,
}

export function useDocuments() {
  return useQuery({
    queryKey: documentKeys.all,
    queryFn: fetchDocuments,
    refetchInterval: (query) =>
      query.state.data?.some((document) => document.status === 'processing') ? PROCESSING_POLL_INTERVAL_MS : false,
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: documentKeys.upload,
    mutationFn: uploadDocument,
    onSuccess: (uploaded) => {
      queryClient.setQueryData<KnowledgeDocument[]>(documentKeys.all, (documents = []) => [
        uploaded,
        ...documents.filter((document) => document.name !== uploaded.name),
      ])
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: documentKeys.delete,
    mutationFn: deleteDocument,
    onSuccess: (_, name) => {
      queryClient.setQueryData<KnowledgeDocument[]>(documentKeys.all, (documents = []) =>
        documents.filter((document) => document.name !== name),
      )
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  })
}

/** Names of files whose upload request is still in flight, across every component. */
export function usePendingUploadNames() {
  return useMutationState({
    filters: { mutationKey: documentKeys.upload, status: 'pending' },
    select: (mutation) => (mutation.state.variables as { file: File } | undefined)?.file.name ?? '',
  })
}

/** Names of documents whose delete request is still in flight. */
export function usePendingDeleteNames() {
  return useMutationState({
    filters: { mutationKey: documentKeys.delete, status: 'pending' },
    select: (mutation) => (mutation.state.variables as string | undefined) ?? '',
  })
}
