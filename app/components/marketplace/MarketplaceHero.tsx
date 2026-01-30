import { useEffect, useRef, useState } from 'react'
import { ArrowDown } from 'lucide-react'

export function MarketplaceHero() {
  const textRef = useRef<HTMLDivElement>(null)

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
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section
      className={`reveal-group min-h-[60vh] flex flex-col lg:px-12 overflow-hidden w-full pt-32 pr-6 pb-20 pl-6 relative justify-center items-center transition-colors duration-500 ${isVisible ? 'is-visible' : ''}`}
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

      <div className="w-full max-w-[1000px] z-10 relative flex flex-col items-center text-center">
        {/* Typography */}
        <div
          ref={textRef}
          className="flex flex-col reveal-group group parallax-text perspective-midrange gap-x-6 gap-y-6 items-center"
        >
          {/* Status Badge */}
          <div
            className={`flex items-center gap-3 mb-4 transition-all duration-1000 ease-out opacity-0 translate-y-4 blur-sm delay-100 ${isVisible ? 'opacity-100 translate-y-0 blur-0' : ''}`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
            <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest">
              Live Marketplace
            </span>
          </div>

          {/* Hero Title */}
          <h1
            className="text-[6vw] lg:text-[4rem] leading-[1] flex flex-col items-center gap-2 font-medium tracking-tighter font-manrope select-none text-transparent bg-clip-text transition-colors duration-500"
            style={{
              backgroundImage:
                'linear-gradient(115deg, var(--text-landing-primary) 40%, var(--text-landing-secondary) 50%, var(--text-landing-primary) 60%)',
              backgroundSize: '200% auto',
              animation: 'light-scan 5s linear infinite',
              willChange: 'background-position',
              color: 'var(--text-landing-primary)',
            }}
          >
            <div>FRESH FARM</div>
            <div className="text-emerald-600 dark:text-emerald-500">
              PRODUCE
            </div>
          </h1>

          {/* Description */}
          <p
            className={`mt-4 max-w-2xl font-light text-lg leading-relaxed transform transition-all duration-1000 ease-out translate-y-8 opacity-0 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : ''}`}
          >
            <span style={{ color: 'var(--text-landing-secondary)' }}>
              Connect directly with farmers. Source high-quality livestock,
              feed, and supplies with zero middlemen. Verified sellers,
              transparent pricing.
            </span>
          </p>

          <div
            className={`mt-8 transform transition-all duration-1000 ease-out translate-y-8 opacity-0 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : ''}`}
          >
            <ArrowDown className="animate-bounce w-6 h-6 text-emerald-500/50" />
          </div>
        </div>
      </div>
    </section>
  )
}
