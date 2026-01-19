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
        <a
          href="https://github.com/captjay98/open-livestock-manager"
          target="_blank"
          rel="noreferrer"
          className="group relative w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center hover:scale-105 transition-all duration-300 shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] border border-transparent hover:border-emerald-400 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="relative z-10"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </a>
      </div>
    </nav>
  )
}
