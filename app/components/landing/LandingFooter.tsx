import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'

export function LandingFooter() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(
        now.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short',
        }),
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <footer
      className="lg:px-12 overflow-hidden w-full border-t pt-32 pr-6 pb-12 pl-6 relative transition-colors duration-500"
      style={{ borderColor: 'var(--border-landing-subtle)' }}
    >
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none opacity-[0.03]">
        <span
          className="text-[25vw] font-bold font-manrope tracking-tighter"
          style={{ color: 'var(--landing-grid-color)' }}
        >
          OPENLIVESTOCK
        </span>
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto flex flex-col lg:flex-row justify-between items-start gap-20">
        <div className="flex flex-col gap-8 max-w-2xl">
          <h2
            className="text-5xl lg:text-7xl font-semibold tracking-tight leading-tight transition-colors duration-500"
            style={{ color: 'var(--text-landing-primary)' }}
          >
            Ready to modernize
            <span
              className="block transition-colors duration-500"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              your farm?
            </span>
          </h2>
          <div className="flex flex-col gap-4">
            <Link
              to="/register"
              className="group flex items-center gap-4 text-xl hover:text-emerald-500 transition-colors"
              style={{ color: 'var(--text-landing-primary)' }}
            >
              <span
                className="border-b pb-1 transition-colors duration-500"
                style={{
                  borderColor: 'var(--border-landing-subtle)',
                }}
              >
                Start Free
              </span>
              <svg
                className="transition-transform group-hover:translate-x-2"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </Link>
            <a
              href="https://github.com/captjay98/open-livestock-manager"
              className="text-sm transition-colors hover:text-emerald-500"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              Or self-host for free →
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-16">
          <div className="flex flex-col gap-4">
            <span
              className="text-xs font-mono uppercase tracking-widest"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              Product
            </span>
            <Link
              to="/features"
              className="text-sm transition-colors hover:text-emerald-500"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              Features
            </Link>
            <Link
              to="/pricing"
              className="text-sm transition-colors hover:text-emerald-500"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              Pricing
            </Link>
            <Link
              to="/roadmap"
              className="text-sm transition-colors hover:text-emerald-500"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              Roadmap
            </Link>
            <Link
              to="/changelog"
              className="text-sm transition-colors hover:text-emerald-500"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              Changelog
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            <span
              className="text-xs font-mono uppercase tracking-widest"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              Resources
            </span>
            <Link
              to="/docs"
              className="text-sm transition-colors hover:text-emerald-500"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              Documentation
            </Link>
            <a
              href="https://github.com/captjay98/open-livestock-manager"
              className="text-sm transition-colors hover:text-emerald-500"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              GitHub
            </a>
            <Link
              to="/community"
              className="text-sm transition-colors hover:text-emerald-500"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              Community
            </Link>
            <Link
              to="/support"
              className="text-sm transition-colors hover:text-emerald-500"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              Support
            </Link>
          </div>
        </div>
      </div>

      <div
        className="relative z-10 mt-32 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-mono uppercase tracking-wider"
        style={{
          borderColor: 'var(--border-landing-subtle)',
          color: 'var(--text-landing-secondary)',
        }}
      >
        <span>© 2026 OpenLivestock. Apache 2.0 after 2 years.</span>
        <span>Last updated: {time}</span>
      </div>
    </footer>
  )
}
