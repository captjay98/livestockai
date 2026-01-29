import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

export function LandingHero() {
  const textRef = useRef<HTMLDivElement>(null)
  const visualRef = useRef<HTMLDivElement>(null)

  // Trigger entry animation
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100)
  }, [])

  // Parallax Logic
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY
      if (scrolled > window.innerHeight) return

      if (textRef.current) {
        textRef.current.style.transform = `translate3d(0, ${scrolled * 0.2}px, 0)`
        textRef.current.style.opacity = String(
          Math.max(0, 1 - scrolled / window.innerHeight),
        )
      }

      if (visualRef.current) {
        visualRef.current.style.transform = `translate3d(0, ${scrolled * -0.1}px, 0)`
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section
      className={`reveal-group min-h-screen flex flex-col lg:px-12 overflow-hidden w-full pt-32 pr-6 pb-20 pl-6 relative justify-center items-center transition-colors duration-500 ${isVisible ? 'is-visible' : ''}`}
      id="hero"
    >
      {/* Background Grid */}
      <div
        className="absolute inset-0 z-0 pointer-events-none transition-colors duration-500"
        style={{
          backgroundImage:
            'radial-gradient(var(--landing-grid-color) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage:
            'radial-gradient(circle at 50% 50%, black, transparent 80%)',
          opacity: 'var(--landing-grid-opacity)',
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 w-full max-w-[1400px] z-10 mr-auto ml-auto relative gap-x-12 gap-y-12 items-end">
        {/* Left: Typography */}
        <div
          ref={textRef}
          className="lg:col-span-8 flex flex-col reveal-group group parallax-text perspective-midrange gap-x-6 gap-y-6"
        >
          {/* Status Badges */}
          <div
            className={`flex items-center gap-3 mb-4 transition-all duration-1000 ease-out opacity-0 translate-y-4 blur-sm delay-100 ${isVisible ? 'opacity-100 translate-y-0 blur-0' : ''}`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
            <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest">
              Beta
            </span>
            <span className="text-neutral-600 dark:text-neutral-600/50">•</span>
            <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">
              Offline-First
            </span>
            <span className="text-neutral-600 dark:text-neutral-600/50">•</span>
            <span className="text-xs font-mono text-violet-600 dark:text-violet-400 uppercase tracking-widest">
              AI-Powered
            </span>
          </div>

          {/* Hero Title */}
          <h1
            className="text-[8vw] lg:text-[5rem] leading-[0.85] flex flex-col items-start gap-4 font-medium tracking-tighter font-manrope select-none text-transparent bg-clip-text transition-colors duration-500"
            style={{
              backgroundImage:
                'linear-gradient(115deg, var(--text-landing-primary) 40%, var(--text-landing-secondary) 50%, var(--text-landing-primary) 60%)',
              backgroundSize: '200% auto',
              animation: 'light-scan 5s linear infinite',
              willChange: 'background-position',
              color: 'var(--text-landing-primary)',
            }}
          >
            <div className="">INTELLIGENT</div>
            <div className="pl-8 lg:pl-24 text-emerald-600 dark:text-emerald-500">
              LIVESTOCK
            </div>
            <div className="">MANAGEMENT</div>
          </h1>

          {/* Description */}
          <p
            className={`mt-8 max-w-xl font-light text-lg leading-relaxed transform transition-all duration-1000 ease-out translate-y-8 opacity-0 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : ''}`}
          >
            <span style={{ color: 'var(--text-landing-secondary)' }}>
              AI-powered livestock management with predictive analytics, smart
              recommendations, and autonomous monitoring. Supports 6+ species
              with offline-first architecture.
            </span>
          </p>

          {/* Buttons */}
          <div
            className={`mt-8 flex flex-wrap gap-4 transform transition-all duration-1000 ease-out translate-y-8 opacity-0 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : ''}`}
          >
            <Link
              to="/register"
              className="group relative px-6 py-3 rounded-lg bg-emerald-500 text-black text-sm font-semibold tracking-tight overflow-hidden hover:bg-emerald-400 transition-colors"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Free
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            <Link
              to="/features"
              className="px-6 py-3 rounded-lg border text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
              style={{
                borderColor: 'var(--border-landing-subtle)',
                color: 'var(--text-landing-primary)',
              }}
            >
              Explore Features
            </Link>
          </div>
        </div>

        {/* Right: 3D Dashboard Mockup */}
        <div
          ref={visualRef}
          className="hidden lg:flex lg:col-span-4 h-full items-center justify-center relative perspective-[2000px] parallax-visual pointer-events-none select-none z-0"
        >
          <div
            className={`reveal-group aspect-[3/4] backdrop-blur-[2px] transform transition-all duration-[3000ms] ease-out origin-center flex flex-col overflow-hidden w-full border rounded-xl shadow-2xl translate-y-8 scale-95 rotate-x-[2deg] rotate-y-[-10deg] gap-x-6 gap-y-6 opacity-0 ${isVisible ? 'opacity-100 translate-y-0 scale-100' : ''}`}
            style={{
              maskImage:
                'linear-gradient(180deg, transparent, black 0%, black 35%, transparent)',
              backgroundColor: 'var(--bg-landing-card)',
              borderColor: 'var(--border-landing-subtle)',
            }}
          >
            {/* Toolbar */}
            <div
              className="h-12 border-b flex items-center px-4 gap-3"
              style={{
                borderColor: 'var(--border-landing-subtle)',
                backgroundColor: 'var(--bg-landing-pill)',
              }}
            >
              <div className="w-2 h-2 rounded-full opacity-20 bg-current text-foreground"></div>
              <div className="w-2 h-2 rounded-full opacity-20 bg-current text-foreground"></div>
              <div className="w-16 h-1.5 rounded-full opacity-10 bg-current text-foreground"></div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex">
              {/* Sidebar */}
              <div
                className="w-16 border-r flex flex-col items-center py-6 gap-4"
                style={{
                  borderColor: 'var(--border-landing-subtle)',
                  backgroundColor: 'var(--bg-landing-pill)',
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-emerald-500"
                  >
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </div>
                <div className="w-8 h-8 rounded-lg opacity-5 bg-current text-foreground"></div>
                <div className="w-8 h-8 rounded-lg opacity-5 bg-current text-foreground"></div>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-6 flex flex-col gap-6">
                {/* Stats Cards */}
                <div
                  className="w-full h-1/3 rounded-lg border relative overflow-hidden"
                  style={{
                    borderColor: 'var(--border-landing-subtle)',
                    backgroundColor: 'var(--bg-landing-pill)',
                  }}
                >
                  <div className="absolute top-4 left-4 w-1/4 h-2 opacity-10 bg-current text-foreground rounded"></div>
                  <div className="absolute bottom-4 left-4 right-4 h-16 flex items-end gap-2">
                    <div
                      className="flex-1 bg-emerald-500/30 rounded-t"
                      style={{ height: '60%' }}
                    ></div>
                    <div
                      className="flex-1 bg-emerald-500/30 rounded-t"
                      style={{ height: '80%' }}
                    ></div>
                    <div
                      className="flex-1 bg-emerald-500/30 rounded-t"
                      style={{ height: '45%' }}
                    ></div>
                    <div
                      className="flex-1 bg-emerald-500/30 rounded-t"
                      style={{ height: '90%' }}
                    ></div>
                  </div>
                </div>

                {/* Two Column Cards */}
                <div className="flex gap-4 h-1/4">
                  <div
                    className="flex-1 rounded-lg border"
                    style={{
                      borderColor: 'var(--border-landing-subtle)',
                      backgroundColor: 'var(--bg-landing-pill)',
                    }}
                  ></div>
                  <div
                    className="flex-1 rounded-lg border"
                    style={{
                      borderColor: 'var(--border-landing-subtle)',
                      backgroundColor: 'var(--bg-landing-pill)',
                    }}
                  ></div>
                </div>

                {/* Text Lines */}
                <div className="flex-1 flex flex-col gap-3 mt-2">
                  <div className="w-full h-2 opacity-5 bg-current text-foreground rounded-sm"></div>
                  <div className="w-5/6 h-2 opacity-5 bg-current text-foreground rounded-sm"></div>
                  <div className="w-4/6 h-2 opacity-5 bg-current text-foreground rounded-sm"></div>
                </div>
              </div>
            </div>

            {/* Scan Line Animation */}
            <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-transparent via-black/[0.03] dark:via-white/[0.02] to-transparent animate-sys-scan pointer-events-none"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
