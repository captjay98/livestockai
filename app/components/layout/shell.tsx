import { useState } from 'react'
import { Sidebar } from './sidebar'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { Menu } from 'lucide-react'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Floating Sidebar */}
      <div className="hidden md:block w-72 shrink-0 h-screen sticky top-0 p-4">
        <Sidebar className="h-full rounded-2xl border border-sidebar-border shadow-md bg-sidebar" />
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile / Drawer Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border shadow-2xl transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) md:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Sidebar onClose={() => setMobileMenuOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 overflow-hidden">
        {/* Mobile header with menu button */}
        <div className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-6 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            className="rounded-xl hover:bg-muted"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <span className="font-bold text-lg">JayFarms</span>
        </div>

        <main className="flex-1 px-3 py-4 sm:p-8 overflow-y-auto overflow-x-hidden">
          <div className="max-w-7xl mx-auto animate-in fade-in-up duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
