import { AnimatePresence } from 'motion/react'
import { Outlet } from 'react-router'

import { SplashScreen } from '@/components/feedback/SplashScreen'
import { useSplashMinimumElapsed } from '@/components/feedback/splash-timer'
import { useDocuments } from '@/features/documents/queries'

import { MobileHeader } from './MobileHeader'
import { Sidebar } from './Sidebar'

export function AppShell() {
  const { isPending } = useDocuments()
  const splashMinimumElapsed = useSplashMinimumElapsed()

  return (
    <>
      <AnimatePresence>{(isPending || !splashMinimumElapsed) && <SplashScreen key="splash" />}</AnimatePresence>

      <div className="flex h-full">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileHeader />
          <main className="min-h-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  )
}
