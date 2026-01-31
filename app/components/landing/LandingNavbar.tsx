import { Link, useRouter } from '@tanstack/react-router'
import { Menu, Moon, Sun, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/logo'
import { Button } from '~/components/ui/button'
import { useSession } from '~/features/auth/client'

export function LandingNavbar() {
  const [isDark, setIsDark] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    // Sync with localStorage or system preference
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light') {
      setIsDark(false)
      document.documentElement.classList.remove('dark')
    } else {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    const unsub = router.history.subscribe(() => {
      setIsMobileMenuOpen(false)
    })
    return () => unsub()
  }, [router])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    if (newTheme) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <>
      <nav className="fixed z-50 top-0 inset-x-0 p-6 flex justify-between items-start pointer-events-none">
        {/* Left: Brand */}
        <Link
          to="/"
          className="pointer-events-auto group flex items-center px-3 py-2 rounded-full border backdrop-blur-xl shadow-[0_4px_24px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 hover:scale-[1.02] z-50"
          style={{
            backgroundColor: 'var(--bg-landing-pill)',
            borderColor: 'var(--border-landing-subtle)',
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <Logo variant="icon" className="h-8" />
        </Link>

        {/* Center: Navigation (Desktop) */}
        <div
          className="hidden md:flex pointer-events-auto absolute left-1/2 -translate-x-1/2 top-6 items-center p-1.5 rounded-full border backdrop-blur-2xl shadow-2xl transition-all duration-300 hover:scale-[1.01]"
          style={{
            backgroundColor: 'var(--bg-landing-card)',
            borderColor: 'var(--border-landing-subtle)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
          }}
        >
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="transition-colors group/link text-sm font-medium rounded-full px-6 py-2.5 relative hover:opacity-100 opacity-60 hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: 'var(--text-landing-primary)' }}
            activeProps={{
              style: {
                opacity: 1,
                color: '#059669',
              },
              className: 'font-semibold',
            }}
          >
            Home
          </Link>
          <Link
            to="/features"
            className="transition-colors group/link text-sm font-medium rounded-full px-6 py-2.5 relative hover:opacity-100 opacity-60 hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: 'var(--text-landing-primary)' }}
            activeProps={{
              style: {
                opacity: 1,
                color: '#059669',
              },
              className: 'font-semibold',
            }}
          >
            Features
          </Link>
          <Link
            to="/marketplace"
            search={{ page: 1, pageSize: 12, radiusKm: 50, sortBy: 'newest' }}
            className="transition-colors group/link text-sm font-medium rounded-full px-6 py-2.5 relative hover:opacity-100 opacity-60 hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: 'var(--text-landing-primary)' }}
            activeProps={{
              style: {
                opacity: 1,
                color: '#059669',
              },
              className: 'font-semibold',
            }}
          >
            Marketplace
          </Link>
          <Link
            to="/pricing"
            className="transition-colors group/link text-sm font-medium rounded-full px-6 py-2.5 relative hover:opacity-100 opacity-60 hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: 'var(--text-landing-primary)' }}
            activeProps={{
              style: {
                opacity: 1,
                color: '#059669',
              },
              className: 'font-semibold',
            }}
          >
            Pricing
          </Link>
          <Link
            to="/docs"
            className="transition-colors group/link text-sm font-medium rounded-full px-6 py-2.5 relative hover:opacity-100 opacity-60 hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: 'var(--text-landing-primary)' }}
            activeProps={{
              style: {
                opacity: 1,
                color: '#059669',
              },
              className: 'font-semibold',
            }}
          >
            Docs
          </Link>
        </div>

        {/* Right: CTA (Desktop) */}
        <div className="hidden md:flex pointer-events-auto items-center gap-4">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="group relative w-12 h-12 rounded-full border backdrop-blur-md flex items-center justify-center hover:scale-105 transition-all duration-300"
            aria-label="Toggle theme"
            style={{
              backgroundColor: 'var(--bg-landing-pill)',
              borderColor: 'var(--border-landing-subtle)',
            }}
          >
            {isDark ? (
              <Moon className="w-5 h-5 text-blue-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
          </button>

          <div
            className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md"
            style={{
              backgroundColor: 'var(--bg-landing-card)',
              borderColor: 'var(--border-landing-subtle)',
            }}
          >
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <span
              className="text-[11px] font-mono font-medium tracking-wider uppercase transition-colors"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              Offline-First
            </span>
          </div>
          {session?.user ? (
            <Link
              to="/dashboard"
              className="group relative px-5 py-2.5 rounded-full bg-emerald-500 text-black flex items-center justify-center hover:scale-105 transition-all duration-300 shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] border border-transparent hover:border-emerald-400 overflow-hidden text-sm font-semibold"
            >
              <span className="relative z-10">Dashboard</span>
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          ) : (
            <Link
              to="/register"
              className="group relative px-5 py-2.5 rounded-full bg-emerald-500 text-black flex items-center justify-center hover:scale-105 transition-all duration-300 shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] border border-transparent hover:border-emerald-400 overflow-hidden text-sm font-semibold"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Menu Trigger */}
        <div className="md:hidden pointer-events-auto z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-full border backdrop-blur-xl h-12 w-12 transition-transform duration-300 active:scale-95"
            style={{
              backgroundColor: 'var(--bg-landing-pill)',
              borderColor: 'var(--border-landing-subtle)',
            }}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-x-0 top-0 z-40 w-full min-h-[50vh] pt-24 pb-8 px-6 bg-white/60 dark:bg-black/60 backdrop-blur-2xl border-b border-white/20 dark:border-white/10 shadow-2xl transition-all duration-300 ease-in-out transform ${
          isMobileMenuOpen
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-lg font-medium hover:text-emerald-500 transition-colors"
            style={{ color: 'var(--text-landing-primary)' }}
          >
            Home
          </Link>
          <Link
            to="/features"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-lg font-medium hover:text-emerald-500 transition-colors"
            style={{ color: 'var(--text-landing-primary)' }}
          >
            Features
          </Link>
          <Link
            to="/marketplace"
            search={{ page: 1, pageSize: 12, radiusKm: 50, sortBy: 'newest' }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-lg font-medium hover:text-emerald-500 transition-colors"
            style={{ color: 'var(--text-landing-primary)' }}
          >
            Marketplace
          </Link>
          <Link
            to="/pricing"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-lg font-medium hover:text-emerald-500 transition-colors"
            style={{ color: 'var(--text-landing-primary)' }}
          >
            Pricing
          </Link>
          <Link
            to="/docs"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-lg font-medium hover:text-emerald-500 transition-colors"
            style={{ color: 'var(--text-landing-primary)' }}
          >
            Docs
          </Link>

          <div className="w-full h-px bg-gray-200 dark:bg-gray-800 my-2 max-w-[200px]" />

          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 text-lg font-medium hover:text-emerald-500 transition-colors"
            style={{ color: 'var(--text-landing-primary)' }}
          >
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            {isDark ? (
              <Sun className="h-5 w-5 text-amber-500" />
            ) : (
              <Moon className="h-5 w-5 text-blue-400" />
            )}
          </button>

          {session?.user ? (
            <Link
              to="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="mt-4 px-8 py-3 rounded-full bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-colors shadow-lg"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/register"
              onClick={() => setIsMobileMenuOpen(false)}
              className="mt-4 px-8 py-3 rounded-full bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-colors shadow-lg"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
