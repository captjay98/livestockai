import { useEffect, useState } from 'react'

export function CommunityHero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100)
  }, [])

  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 mb-8 animate-fade-in-up opacity-0 ${isVisible ? 'opacity-100' : ''}`}
          style={{ transitionDelay: '100ms' }}
        >
          <div className="px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider border bg-purple-500/10 text-purple-500 border-purple-500/20">
            Join the Movement
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
          Farmer <br />
          <span className="text-purple-500">Community</span>
        </h1>

        {/* Description */}
        <p
          className={`text-lg mb-12 font-light max-w-2xl mx-auto leading-relaxed animate-fade-in-up opacity-0 ${isVisible ? 'opacity-100' : ''}`}
          style={{
            color: 'var(--text-landing-secondary)',
            transitionDelay: '300ms',
          }}
        >
          Connect with farmers worldwide. Share experiences, ask questions, and
          learn from others managing livestock operations.
        </p>

        {/* Buttons */}
        <div
          className={`flex flex-wrap justify-center gap-4 animate-fade-in-up opacity-0 ${isVisible ? 'opacity-100' : ''}`}
          style={{ transitionDelay: '400ms' }}
        >
          <a
            href="/register"
            className="px-8 py-4 rounded-lg bg-emerald-500 text-white font-semibold tracking-tight hover:bg-emerald-600 transition-colors hover:scale-105 transform"
          >
            Join Community
          </a>
          <a
            href="https://chat.whatsapp.com/livestockai"
            className="px-8 py-4 rounded-lg bg-[#25D366] text-white font-semibold tracking-tight hover:bg-[#128C7E] transition-colors hover:scale-105 transform"
          >
            WhatsApp Group
          </a>
          <a
            href="https://discord.gg/livestockai"
            className="px-8 py-4 rounded-lg bg-[#5865F2] text-white font-semibold tracking-tight hover:bg-[#4752C4] transition-colors hover:scale-105 transform"
          >
            Discord Server
          </a>
        </div>
      </div>
    </section>
  )
}
