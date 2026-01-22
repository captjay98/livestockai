import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouter,
} from '@tanstack/react-router'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { QueryClientProvider } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Toaster } from 'sonner'
import type { QueryClient } from '@tanstack/react-query'
import { createPersister } from '~/lib/query-client'
// import { AppShell } from '~/components/layout/shell'
import { FarmProvider } from '~/features/farms/context'
import { SettingsProvider } from '~/features/settings'
import { ThemeProvider } from '~/features/theme'
import { NotificationsProvider } from '~/features/notifications'
import { I18nProvider } from '~/features/i18n'
import { NotFoundPage } from '~/components/not-found'
import { ErrorPage } from '~/components/error-page'
// import { TanStackRouterDevtools } from '@tanstack/router-devtools'

import appCss from '~/styles.css?url'
import { PWAPrompt } from '~/components/pwa-prompt'
import { OfflineIndicator } from '~/components/offline-indicator'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  errorComponent: ({ error }) => (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Error - OpenLivestock</title>
        <link rel="stylesheet" href={appCss} />
      </head>
      <body>
        <ErrorPage error={error} />
      </body>
    </html>
  ),
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
  const queryClient = (router.options.context as { queryClient: QueryClient })
    .queryClient
  const persister = useMemo(() => createPersister(), [])

  // Common content that should be identical on server and client
  const content = (
    <>
      <SettingsProvider>
        <FarmProvider>
          <ThemeProvider>
            <I18nProvider>
              <NotificationsProvider>
                <Outlet />
                <PWAPrompt />
                <OfflineIndicator />
                <Toaster richColors position="top-right" />
              </NotificationsProvider>
            </I18nProvider>
          </ThemeProvider>
        </FarmProvider>
      </SettingsProvider>
    </>
  )

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{import.meta.env.VITE_APP_NAME ?? 'OpenLivestock'}</title>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {persister ? (
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister }}
            onSuccess={() => {
              queryClient.resumePausedMutations().then(() => {
                queryClient.invalidateQueries()
              })
            }}
          >
            {content}
          </PersistQueryClientProvider>
        ) : (
          <QueryClientProvider client={queryClient}>
            {content}
          </QueryClientProvider>
        )}
        <Scripts />
      </body>
    </html>
  )
}
