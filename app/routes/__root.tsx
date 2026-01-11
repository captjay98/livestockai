import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouter,
} from '@tanstack/react-router'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { useMemo } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { createPersister } from '~/lib/query-client'
// import { AppShell } from '~/components/layout/shell'
import { ThemeProvider } from '~/components/theme-provider'
import { FarmProvider } from '~/components/farm-context'
import { NotFoundPage } from '~/components/not-found'
import { ErrorPage } from '~/components/error-page'
// import { TanStackRouterDevtools } from '@tanstack/router-devtools'

import appCss from '~/styles.css?url'
import { PWAPrompt } from '~/components/pwa-prompt'
import { OfflineIndicator } from '~/components/offline-indicator'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  errorComponent: ({ error }) => <ErrorPage error={error} />,
  head: () => ({
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/manifest.json' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    ],
    meta: [
      { name: 'theme-color', content: '#ffffff' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
    ],
    scripts: [
      {
        children: `
            (function() {
              try {
                var storageKey = 'vite-ui-theme'
                var defaultTheme = 'system'
                var theme = localStorage.getItem(storageKey) || defaultTheme
                var root = window.document.documentElement
                
                root.classList.remove('light', 'dark')
                
                if (theme === 'system') {
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? 'dark'
                    : 'light'
                  root.classList.add(systemTheme)
                } else {
                  root.classList.add(theme)
                }
              } catch (e) {}
            })()
          `,
      },
    ],
  }),
})

function RootComponent() {
  const router = useRouter()
  // @ts-ignore - Context types are a bit loose here
  const queryClient = router.options.context?.queryClient as QueryClient
  const persister = useMemo(() => createPersister(), [])

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- persister is undefined on server, truthy on client
  if (!persister || !queryClient) {
    // Fallback for SSR or if setup failed, just render Outlet
    // Actually, createPersister returns undefined check internal logic
    // But we need to be safe.
    return (
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <html lang="en" suppressHydrationWarning>
          <head>
            <meta charSet="UTF-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <title>JayFarms</title>
            <HeadContent />
          </head>
          <body>
            <FarmProvider>
              <Outlet />
              <PWAPrompt />
            </FarmProvider>
            <Scripts />
          </body>
        </html>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta charSet="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>{import.meta.env.VITE_APP_NAME ?? 'OpenLivestock'}</title>
          <HeadContent />
        </head>
        <body>
          <FarmProvider>
            <PersistQueryClientProvider
              client={queryClient}
              persistOptions={{ persister }}
              onSuccess={() => {
                // Optional: Resume paused mutations
                queryClient.resumePausedMutations().then(() => {
                  queryClient.invalidateQueries()
                })
              }}
            >
              <Outlet />
              <PWAPrompt />
              <OfflineIndicator />
            </PersistQueryClientProvider>
          </FarmProvider>
          <Scripts />
          {/* <TanStackRouterDevtools position="bottom-right" /> */}
        </body>
      </html>
    </ThemeProvider>
  )
}
