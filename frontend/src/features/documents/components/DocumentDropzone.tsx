import { CloudUpload } from 'lucide-react'
import { useState } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ApiError, errorMessage } from '@/lib/api-client'
import { cn } from '@/lib/cn'

import { MAX_UPLOAD_BYTES } from '../api'
import { useDocuments, useUploadDocument } from '../queries'

const MAX_UPLOAD_MB = MAX_UPLOAD_BYTES / (1024 * 1024)

export function DocumentDropzone() {
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
        toast.error(`Couldn't upload ${file.name}`, { description: errorMessage(error) })
      })
  }

  const handleDrop = (acceptedFiles: File[], rejections: FileRejection[]) => {
    rejections.forEach(({ file, errors }) =>
      toast.error(`Couldn't upload ${file.name}`, { description: describeRejection(errors[0]?.code) }),
    )

    const existingNames = new Set(documents.map((document) => document.name))
    const conflicts = acceptedFiles.filter((file) => existingNames.has(file.name))
    acceptedFiles.filter((file) => !existingNames.has(file.name)).forEach((file) => upload(file, false))
    if (conflicts.length > 0) setFilesToReplace(conflicts)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: MAX_UPLOAD_BYTES,
  })

  const replaceCount = filesToReplace.length

  return (
    <>
      <div
        {...getRootProps()}
        className={cn(
          'group relative flex cursor-pointer flex-col items-center gap-3 overflow-hidden rounded-card border-2 border-dashed px-6 py-10 text-center transition-all duration-200',
          isDragActive
            ? 'scale-[1.01] border-primary bg-accent-soft'
            : 'border-border-strong bg-surface hover:border-primary hover:bg-surface-muted',
        )}
      >
        <input {...getInputProps()} />
        <span
          className={cn(
            'grid size-14 place-items-center rounded-2xl bg-primary text-on-primary transition-transform duration-300',
            isDragActive ? '-translate-y-1 rotate-[-6deg]' : 'group-hover:-translate-y-0.5',
          )}
        >
          <CloudUpload className="size-6" />
        </span>
        <div>
          <p className="font-display text-lg">{isDragActive ? 'Drop to upload' : 'Drop PDFs here'}</p>
          <p className="mt-0.5 text-sm text-muted">
            or <span className="font-semibold text-text underline underline-offset-4">browse your files</span>
          </p>
        </div>
        <p className="font-label font-semibold text-[11px] tracking-wider text-subtle uppercase">
          PDF · up to {MAX_UPLOAD_MB} MB · multiple files
        </p>
      </div>

      <ConfirmDialog
        open={replaceCount > 0}
        onOpenChange={(open) => !open && setFilesToReplace([])}
        title={replaceCount === 1 ? 'Replace existing file?' : `Replace ${replaceCount} existing files?`}
        description={
          <>
            <p>
              {replaceCount === 1 ? 'A file with this name is' : 'Files with these names are'} already in your knowledge
              base. Uploading will overwrite {replaceCount === 1 ? 'it' : 'them'} and rebuild the search index, so
              answers will use the new version.
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
    </>
  )
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
