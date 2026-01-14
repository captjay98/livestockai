import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouter,
} from '@tanstack/react-router'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
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
  const queryClient = router.options.context.queryClient as QueryClient
  const persister = useMemo(() => createPersister(), [])

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- persister is undefined on server, truthy on client
  if (!persister || !queryClient) {
    // Fallback for SSR or if setup failed, just render Outlet
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta charSet="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>OpenLivestock</title>
          <HeadContent />
        </head>
        <body>
          <FarmProvider>
            <SettingsProvider>
              <ThemeProvider>
                <I18nProvider>
                  <NotificationsProvider>
                    <Outlet />
                    <PWAPrompt />
                  </NotificationsProvider>
                </I18nProvider>
              </ThemeProvider>
            </SettingsProvider>
          </FarmProvider>
          <Scripts />
        </body>
      </html>
    )
  }

  return (
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
            <SettingsProvider>
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
                <ThemeProvider>
                  <Outlet />
                  <PWAPrompt />
                  <OfflineIndicator />
                  <Toaster richColors position="top-right" />
                </ThemeProvider>
              </PersistQueryClientProvider>
            </SettingsProvider>
          </FarmProvider>
          <Scripts />
          {/* <TanStackRouterDevtools position="bottom-right" /> */}
        </body>
      </html>
    )
}
