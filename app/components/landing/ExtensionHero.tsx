import { Building2 } from 'lucide-react'

export function ExtensionHero() {
  return (
    <section className="min-h-[60vh] flex flex-col justify-center w-full pt-40 pb-20 px-6 lg:px-12 relative overflow-hidden transition-colors duration-500">
      <div
        className="absolute inset-0 z-0 opacity-20 pointer-events-none transition-colors duration-500"
        style={{
          backgroundImage: 'radial-gradient(#a855f7 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage:
            'radial-gradient(circle at 50% 50%, black, transparent 80%)',
        }}
      />

      <div className="max-w-[1400px] mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8 animate-fade-in">
          <Building2 className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-mono text-purple-400 uppercase tracking-wider">
            For Government & NGOs
          </span>
        </div>

        <h1
          className="text-5xl lg:text-7xl font-manrope font-semibold mb-6 tracking-tight animate-slide-up text-transparent bg-clip-text"
          style={{
            backgroundImage:
              'linear-gradient(115deg, var(--text-landing-primary) 40%, var(--text-landing-secondary) 50%, var(--text-landing-primary) 60%)',
            backgroundSize: '200% auto',
            animation: 'light-scan 5s linear infinite',
          }}
        >
          <span className="block">Extension Worker</span>
          <span className="block text-purple-500">Mode</span>
        </h1>

        <p
          className="max-w-2xl mx-auto text-lg animate-slide-up delay-100 transition-colors duration-500"
          style={{ color: 'var(--text-landing-secondary)' }}
        >
          Empower your agricultural extension services with district-wide farm
          monitoring, early disease detection, and digital advisory tools.
        </p>
      </div>
    </section>
  )
}
