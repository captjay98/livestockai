/**
 * Landing layout wrapper for marketing pages
 */

interface LandingLayoutProps {
  children: React.ReactNode
  variant?: 'default' | 'neon'
}

export function LandingLayout({ children, variant = 'default' }: LandingLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b py-4">
        <div className="container mx-auto px-4">
          <nav className="flex justify-between items-center">
            <a href="/" className="text-xl font-bold">OpenLivestock</a>
            <div className="flex gap-4">
              <a href="/features" className="hover:underline">Features</a>
              <a href="/pricing" className="hover:underline">Pricing</a>
              <a href="/docs" className="hover:underline">Docs</a>
            </div>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          &copy; 2025 OpenLivestock. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
