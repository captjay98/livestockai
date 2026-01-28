import { LayoutGrid } from 'lucide-react'

export function FeaturesHero() {
    return (
        <section className="min-h-[60vh] flex flex-col justify-center w-full pt-40 pb-20 px-6 lg:px-12 relative overflow-hidden transition-colors duration-500">
            <div
                className="absolute inset-0 z-0 opacity-20 pointer-events-none transition-colors duration-500"
                style={{
                    backgroundImage:
                        'radial-gradient(#10b981 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    maskImage:
                        'radial-gradient(circle at 50% 50%, black, transparent 80%)',
                }}
            />

            <div className="max-w-[1400px] mx-auto text-center relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8 animate-fade-in">
                    <LayoutGrid className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                        Core Features
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
                    <span className="block">Comprehensive</span>
                    <span className="block text-emerald-500">
                        Farm Management
                    </span>
                </h1>

                <p
                    className="max-w-2xl mx-auto text-lg animate-slide-up delay-100 transition-colors duration-500"
                    style={{ color: 'var(--text-landing-secondary)' }}
                >
                    Everything you need to manage modern livestock operations.
                    From predictive analytics to multi-species support.
                </p>
            </div>
        </section>
    )
}
