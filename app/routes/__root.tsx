import { Header } from '~/components/navigation'
import { createRootRoute, Outlet, HeadContent, Scripts } from '@tanstack/react-router'
// import { TanStackRouterDevtools } from '@tanstack/router-devtools'

import appCss from '~/styles.css?url'

export const Route = createRootRoute({
  component: RootComponent,
  head: () => ({
    links: [
      { rel: 'stylesheet', href: appCss },
    ],
  }),
})

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>JayFarms</title>
        <HeadContent />
      </head>
      <body>
        <div className="min-h-screen bg-background">
          <Header />
          <main>
            <Outlet />
          </main>
        </div>
        <Scripts />
        {/* <TanStackRouterDevtools position="bottom-right" /> */}
      </body>
    </html>
  )
}