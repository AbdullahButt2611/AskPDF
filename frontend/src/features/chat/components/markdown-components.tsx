import type { Components } from 'react-markdown'

export const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  h1: ({ children }) => <h3 className="mt-5 mb-2 text-xl first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-5 mb-2 text-lg first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-4 mb-2 font-display text-base first:mt-0">{children}</h4>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 marker:text-subtle last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 marker:text-subtle last:mb-0">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded-md bg-surface-muted px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-accent pl-4 text-muted italic">{children}</blockquote>
  ),
}
