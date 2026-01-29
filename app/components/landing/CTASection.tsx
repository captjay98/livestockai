import { ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export function CTASection() {
  return (
    <section
      className="w-full py-32 px-6 lg:px-12 relative overflow-hidden border-t font-manrope transition-colors duration-500"
      style={{
        backgroundColor: 'var(--bg-landing-page)',
        borderColor: 'var(--border-landing-subtle)',
      }}
    >
      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none transition-opacity duration-500"
        style={{
          backgroundImage:
            'linear-gradient(var(--landing-grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--landing-grid-color) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          opacity: 'var(--landing-grid-opacity)',
        }}
      />

      {/* Center Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 text-emerald-500 mb-8 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="font-mono text-xs uppercase tracking-[0.3em]">
            System Ready
          </span>
        </div>

        <h2
          className="text-5xl lg:text-7xl font-semibold mb-8 tracking-tighter leading-[0.9] transition-colors duration-500"
          style={{ color: 'var(--text-landing-primary)' }}
        >
          Initialize Your <br />
          <span
            className="transition-colors duration-500"
            style={{ color: 'var(--text-landing-primary)' }}
          >
            Farm Operation
          </span>
        </h2>

        <p
          className="text-lg mb-12 font-light max-w-2xl mx-auto leading-relaxed transition-colors duration-500"
          style={{ color: 'var(--text-landing-secondary)' }}
        >
          Deploy the world's most advanced open-source livestock protocols.{' '}
          <br />
          Zero infrastructure required.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link
            to="/register"
            className="group relative px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg overflow-hidden transition-all duration-300 min-w-[200px]"
          >
            <div className="relative z-10 flex items-center justify-center gap-2 font-bold tracking-tight">
              <span>DEPLOY INSTANCE</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
            {/* Scanline overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
          </Link>

          <Link
            to="/pricing"
            className="px-8 py-4 rounded-lg border font-mono text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors min-w-[200px] tracking-wider uppercase"
            style={{
              borderColor: 'var(--border-landing-subtle)',
              color: 'var(--text-landing-primary)',
            }}
          >
            View Protocols
          </Link>
        </div>

        {/* Tech Footer Line */}
        <div className="mt-20 flex items-center justify-center gap-4 text-[10px] font-mono text-neutral-500 dark:text-neutral-600 uppercase tracking-widest">
          <span>Beta</span>
          <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-800"></span>
          <span>Offline-First</span>
          <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-800"></span>
          <span>Encrypted</span>
        </div>
      </div>
    </section>
  )
}
