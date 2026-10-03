import { useState } from 'react'
import { useDropzone, type DropzoneOptions, type FileRejection } from 'react-dropzone'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ApiError, errorMessage } from '@/lib/api-client'

import { MAX_UPLOAD_BYTES } from './api'
import { useDocuments, useUploadDocument } from './queries'

export const MAX_UPLOAD_MB = MAX_UPLOAD_BYTES / (1024 * 1024)

/**
 * PDF upload via react-dropzone, including the "replace existing file?" confirmation. Render `replaceDialog`
 * next to the drop target. `options` passes through to react-dropzone (e.g. `noClick` for a page-wide target).
 */
export function usePdfDropzone(options: Pick<DropzoneOptions, 'noClick' | 'noKeyboard'> = {}) {
  const { data: documents = [] } = useDocuments()
  const uploadDocument = useUploadDocument()
  const [filesToReplace, setFilesToReplace] = useState<File[]>([])

  const upload = (file: File, overwrite: boolean) => {
    uploadDocument
      .mutateAsync({ file, overwrite })
      .then(() =>
        toast.success(overwrite ? `Replaced ${file.name}` : `Uploaded ${file.name}`, {
          description: "Processing has started. You can ask about it once it's ready.",
        }),
      )
      .catch((error: unknown) => {
        // Another upload created the same name after this drop was checked; ask before overwriting
        if (error instanceof ApiError && error.status === 409) {
          setFilesToReplace((files) => [...files, file])
          return
        }
        toast.error(`Couldn't Upload ${file.name}`, { description: errorMessage(error) })
      })
  }

  const handleDrop = (acceptedFiles: File[], rejections: FileRejection[]) => {
    rejections.forEach(({ file, errors }) =>
      toast.error(`Couldn't Upload ${file.name}`, { description: describeRejection(errors[0]?.code) }),
    )
    const existingNames = new Set(documents.map((document) => document.name))
    const conflicts = acceptedFiles.filter((file) => existingNames.has(file.name))
    acceptedFiles.filter((file) => !existingNames.has(file.name)).forEach((file) => upload(file, false))
    if (conflicts.length > 0) setFilesToReplace(conflicts)
  }

  const dropzone = useDropzone({
    ...options,
    onDrop: handleDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: MAX_UPLOAD_BYTES,
  })

  const replaceCount = filesToReplace.length
  const replaceDialog = (
    <ConfirmDialog
      open={replaceCount > 0}
      onOpenChange={(open) => !open && setFilesToReplace([])}
      title={replaceCount === 1 ? 'Replace Existing File?' : `Replace ${replaceCount} Existing Files?`}
      description={
        <>
          <p>
            {replaceCount === 1 ? 'A file with this name is' : 'Files with these names are'} already in your knowledge
            base. Uploading will overwrite {replaceCount === 1 ? 'it' : 'them'} and rebuild the search index, so answers
            will use the new version.
          </p>
          <ul className="mt-3 space-y-1">
            {filesToReplace.map((file) => (
              <li key={file.name} className="truncate font-label text-xs text-text">
                {file.name}
              </li>
            ))}
          </ul>
        </>
      }
      confirmLabel={replaceCount === 1 ? 'Replace file' : 'Replace files'}
      onConfirm={() => {
        filesToReplace.forEach((file) => upload(file, true))
        setFilesToReplace([])
      }}
    />
  )

  return { ...dropzone, replaceDialog }
}

function describeRejection(code: string | undefined) {
  switch (code) {
    case 'file-too-large':
      return `The file is larger than the ${MAX_UPLOAD_MB} MB limit.`
    case 'file-invalid-type':
      return 'Only PDF files can be uploaded.'
    default:
      return 'This file could not be uploaded.'
  }
}
