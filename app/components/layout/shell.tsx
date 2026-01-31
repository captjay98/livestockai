import { useState } from 'react'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'
import { GlobalQuickAction } from './fab'
import type { User } from '~/features/auth/types'
import { cn } from '~/lib/utils'

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode
  user: User
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Global Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-3/4 h-3/4 bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Desktop Floating Sidebar */}
      <div className="hidden md:block w-72 shrink-0 h-screen sticky top-0 p-4 z-20">
        <Sidebar
          className="h-full rounded-3xl" // Removed border/shadow/bg here as they are in Sidebar component now
          user={user}
        />
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
          'fixed inset-y-0 left-0 z-50 w-80 bg-background/0 transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) md:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Sidebar
          className="h-full rounded-r-3xl"
          onClose={() => setMobileMenuOpen(false)}
          user={user}
        />
      </div>

      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 overflow-hidden relative z-10">
        <main className="flex-1 px-3 py-4 sm:px-6 sm:py-8 overflow-y-auto overflow-x-hidden">
          <div className="max-w-7xl mx-auto animate-in fade-in-up duration-500">
            {children}
          </div>
        </main>
      </div>

      <GlobalQuickAction />
      <BottomNav onMenuClick={() => setMobileMenuOpen(true)} />
    </div>
  )
}
