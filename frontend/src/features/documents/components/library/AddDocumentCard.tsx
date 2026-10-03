import { Plus } from 'lucide-react'

import { MAX_UPLOAD_MB } from '../../use-pdf-dropzone'

/** Always the first card in the grid: a dashed ghost page that opens the file picker. */
export function AddDocumentCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full min-h-56 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.4rem] border-2 border-dashed border-border-strong bg-surface/50 p-5 text-center backdrop-blur transition-[transform,border-color,background-color] duration-300 hover:-translate-y-1 hover:border-primary hover:bg-surface"
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-primary text-on-primary transition-transform duration-300 group-hover:rotate-90">
        <Plus className="size-5" strokeWidth={2.5} />
      </span>
      <span className="font-display text-lg">Add a Document</span>
      <span className="font-label text-[11px] font-semibold tracking-wider text-subtle uppercase">
        PDF · up to {MAX_UPLOAD_MB} MB · or drop anywhere
      </span>
    </button>
  )
}
