import { createBrowserRouter } from 'react-router'

import { AppShell } from '@/components/layout/AppShell'

// Each page is its own chunk, so a route's dependencies (markdown, dropzone…) load only when it's visited
export const router = createBrowserRouter([
  {
    element: <AppShell />,
    // The splash screen in AppShell covers the moment the first lazy page is loading
    HydrateFallback: () => null,
    children: [
      {
        index: true,
        lazy: () => import('@/routes/AskPage').then((module) => ({ Component: module.AskPage })),
      },
      {
        path: 'knowledge-base',
        lazy: () => import('@/routes/KnowledgeBasePage').then((module) => ({ Component: module.KnowledgeBasePage })),
      },
      {
        path: 'settings',
        lazy: () => import('@/routes/SettingsPage').then((module) => ({ Component: module.SettingsPage })),
      },
      {
        path: '*',
        lazy: () => import('@/routes/NotFoundPage').then((module) => ({ Component: module.NotFoundPage })),
      },
    ],
  },
])
