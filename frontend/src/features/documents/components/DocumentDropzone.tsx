import { CloudUpload } from 'lucide-react'

import { cn } from '@/lib/cn'

import { MAX_UPLOAD_MB, usePdfDropzone } from '../use-pdf-dropzone'

export function DocumentDropzone() {
  const { getRootProps, getInputProps, isDragActive, replaceDialog } = usePdfDropzone()

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
          <p className="font-display text-lg">{isDragActive ? 'Drop to Upload' : 'Drop PDFs Here'}</p>
          <p className="mt-0.5 text-sm text-muted">
            or <span className="font-semibold text-text underline underline-offset-4">browse your files</span>
          </p>
        </div>
        <p className="font-label font-semibold text-[11px] tracking-wider text-subtle uppercase">
          PDF · up to {MAX_UPLOAD_MB} MB · multiple files
        </p>
      </div>
      {replaceDialog}
    </>
  )
}
