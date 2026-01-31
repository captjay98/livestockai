import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export function DocsHero() {
  const { t } = useTranslation('common')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100)
  }, [])

  return (
    <section className="relative pt-32 pb-12 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 mb-8 animate-fade-in-up opacity-0 ${isVisible ? 'opacity-100' : ''}`}
          style={{ transitionDelay: '100ms' }}
        >
          <div className="px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            Knowledge Base
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
          Developer <br />
          <span className="text-emerald-500">Documentation</span>
        </h1>

        {/* Description */}
        <p
          className={`text-lg mb-12 font-light max-w-2xl mx-auto leading-relaxed animate-fade-in-up opacity-0 ${isVisible ? 'opacity-100' : ''}`}
          style={{
            color: 'var(--text-landing-secondary)',
            transitionDelay: '300ms',
          }}
        >
          Everything you need to deploy, configure, and extend LivestockAI.
        </p>

        {/* Search Placeholder */}
        <div
          className={`max-w-xl mx-auto relative animate-fade-in-up opacity-0 ${isVisible ? 'opacity-100' : ''}`}
          style={{ transitionDelay: '400ms' }}
        >
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg
              className="w-5 h-5 text-neutral-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
          <input
            type="text"
            placeholder={t('docs.searchPlaceholder', {
              defaultValue: 'Search documentation...',
            })}
            className="w-full pl-12 pr-4 py-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-light"
            style={{
              backgroundColor: 'var(--bg-landing-card)',
              borderColor: 'var(--border-landing-subtle)',
              color: 'var(--text-landing-primary)',
            }}
          />
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <span
              className="text-xs px-2 py-1 rounded border opacity-50 font-mono"
              style={{
                borderColor: 'var(--border-landing-subtle)',
                color: 'var(--text-landing-secondary)',
              }}
            >
              ⌘K
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
