import { useEffect, useState } from 'react'

export function ChangelogHero() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        setTimeout(() => setIsVisible(true), 100)
    }, [])

    return (
        <section
            className="relative pt-32 pb-20 px-6 overflow-hidden border-b"
            style={{ borderColor: 'var(--border-landing-subtle)' }}
        >
            <div className="max-w-4xl mx-auto text-center relative z-10">
                {/* Badge */}
                <div
                    className={`inline-flex items-center gap-2 mb-8 animate-fade-in-up opacity-0 ${isVisible ? 'opacity-100' : ''}`}
                    style={{ transitionDelay: '100ms' }}
                >
                    <div
                        className="px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider border flex items-center gap-2"
                        style={{
                            backgroundColor: 'var(--bg-landing-pill)',
                            borderColor: 'var(--border-landing-subtle)',
                            color: 'var(--text-landing-secondary)',
                        }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Latest Release: v1.0.0
                    </div>
                </div>

                {/* Title */}
                <h1
                    className={`text-5xl lg:text-7xl font-semibold mb-8 tracking-tighter leading-[0.9] text-transparent bg-clip-text animate-fade-in-up opacity-0 ${isVisible ? 'opacity-100' : ''}`}
                    style={{
                        backgroundImage:
                            'linear-gradient(115deg, var(--text-landing-primary) 40%, var(--text-landing-secondary) 50%, var(--text-landing-primary) 60%)',
                        backgroundSize: '200% auto',
                        animation: 'light-scan 5s linear infinite',
                        transitionDelay: '200ms',
                    }}
                >
                    Product <br />
                    <span className="text-emerald-500">Changelog</span>
                </h1>

                {/* Description */}
                <p
                    className={`text-lg font-light max-w-2xl mx-auto leading-relaxed animate-fade-in-up opacity-0 ${isVisible ? 'opacity-100' : ''}`}
                    style={{
                        color: 'var(--text-landing-secondary)',
                        transitionDelay: '300ms',
                    }}
                >
                    New updates and improvements to OpenLivestock.
                </p>
            </div>
        </section>
    )
}
