import { PageHeader } from '@/components/layout/PageHeader'
import { DocumentDropzone } from '@/features/documents/components/DocumentDropzone'
import { DocumentList } from '@/features/documents/components/DocumentList'
import { useDocuments } from '@/features/documents/queries'

export function KnowledgeBasePage() {
  const { data: documents = [] } = useDocuments()
  const stats = [
    { label: 'Documents', value: documents.length },
    { label: 'Ready', value: documents.filter((document) => document.status === 'ready').length },
    { label: 'Processing', value: documents.filter((document) => document.status === 'processing').length },
    { label: 'Passages', value: documents.reduce((total, document) => total + document.chunkCount, 0) },
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-5 py-10 sm:px-8">
        <PageHeader
          eyebrow="Knowledge Base"
          title="Your Documents"
          description="Everything here is searchable from the Ask page. Remove a file and its embeddings go with it."
        />

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-card border border-border bg-surface px-4 py-3">
              <dt className="font-label font-semibold text-[11px] tracking-wider text-subtle uppercase">{stat.label}</dt>
              <dd className="mt-1 font-display text-2xl tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <DocumentDropzone />
        <DocumentList />
      </div>
    </div>
  )
}
