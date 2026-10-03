import { Link } from 'react-router'

import { Logo } from '@/components/brand/Logo'

export function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <Logo variant="mark" className="h-14" />
      <p className="font-label font-semibold text-xs tracking-wider text-subtle uppercase">Error 404</p>
      <h1 className="text-3xl">This Page Doesn't Exist</h1>
      <Link to="/" className="font-semibold underline underline-offset-4">
        Back to Ask
      </Link>
    </div>
  )
}
