import { Plus, Search, X } from 'lucide-react'

import RubberSegment from '@/components/reactbits/RubberSegment'

import type { DocumentStatus } from '../../api'

export type StatusFilter = 'all' | DocumentStatus

interface LibraryToolbarProps {
  query: string
  onQueryChange: (query: string) => void
  filter: StatusFilter
  onFilterChange: (filter: StatusFilter) => void
  counts: Record<StatusFilter, number>
  onAdd: () => void
}

export function LibraryToolbar({ query, onQueryChange, filter, onFilterChange, counts, onAdd }: LibraryToolbarProps) {
  const filters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: `All ${counts.all}` },
    { value: 'ready', label: `Ready ${counts.ready}` },
    { value: 'processing', label: `Processing ${counts.processing}` },
    { value: 'failed', label: `Failed ${counts.failed}` },
  ]

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <label className="group relative flex h-11 shrink-0 items-center rounded-full border border-border-strong bg-surface/80 pr-2 pl-4 backdrop-blur transition-colors focus-within:border-primary lg:w-full lg:max-w-sm lg:flex-1">
        <Search className="size-4 shrink-0 text-subtle transition-colors group-focus-within:text-primary" />
        <span className="sr-only">Search documents</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by file name…"
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-subtle focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            aria-label="Clear search"
            className="grid size-7 cursor-pointer place-items-center rounded-full text-subtle hover:bg-surface-muted hover:text-text"
          >
            <X className="size-3.5" />
          </button>
        )}
      </label>

      <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
        <div className="max-w-full overflow-x-auto">
          <RubberSegment
            aria-label="Filter by status"
            items={filters}
            value={filter}
            onChange={(value) => onFilterChange(value as StatusFilter)}
            size="md"
          />
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-primary pr-5 pl-4 text-sm font-semibold text-on-primary shadow-[0_12px_28px_-14px_var(--shadow-color)] transition-transform hover:-translate-y-0.5 active:scale-95"
        >
          <Plus className="size-4" strokeWidth={2.5} />
          Add PDFs
        </button>
      </div>
    </div>
  )
}
