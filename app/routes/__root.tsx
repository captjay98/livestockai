import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { AppShell } from '~/components/layout/shell'
import { ThemeProvider } from '~/components/theme-provider'
import { FarmProvider } from '~/components/farm-context'
// import { TanStackRouterDevtools } from '@tanstack/router-devtools'

import appCss from '~/styles.css?url'

export const Route = createRootRoute({
  component: RootComponent,
  head: () => ({
    links: [{ rel: 'stylesheet', href: appCss }],
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
            <AppShell>
              <Outlet />
            </AppShell>
          </FarmProvider>
          <Scripts />
          {/* <TanStackRouterDevtools position="bottom-right" /> */}
        </body>
      </html>
    </ThemeProvider>
  )
}
