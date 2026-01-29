import { Link } from '@tanstack/react-router'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/logo'

export function LandingNavbar() {
  const [isDark, setIsDark] = useState(true)

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
    <nav className="fixed z-50 top-0 inset-x-0 p-6 flex justify-between items-start pointer-events-none">
      {/* Left: Brand */}
      <Link
        to="/"
        className="pointer-events-auto group flex items-center px-3 py-2 rounded-full border backdrop-blur-xl shadow-[0_4px_24px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 hover:scale-[1.02]"
        style={{
          backgroundColor: 'var(--bg-landing-pill)',
          borderColor: 'var(--border-landing-subtle)',
        }}
      >
        <Logo variant="icon" className="h-8" />
      </Link>

      {/* Center: Navigation */}
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

      {/* Right: CTA */}
      <div className="pointer-events-auto flex items-center gap-4">
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
        <Link
          to="/register"
          className="group relative px-5 py-2.5 rounded-full bg-emerald-500 text-black flex items-center justify-center hover:scale-105 transition-all duration-300 shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] border border-transparent hover:border-emerald-400 overflow-hidden text-sm font-semibold"
        >
          <span className="relative z-10">Get Started</span>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </Link>
      </div>
    </nav>
  )
}
