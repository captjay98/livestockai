import { useEffect, useRef, useState } from 'react'
import { Bot, Command, Sparkles, Terminal } from 'lucide-react'

export function AgentReadySection() {
    const sectionRef = useRef<HTMLDivElement>(null)
    const [inView, setInView] = useState(false)
    const [activeLine, setActiveLine] = useState(0)

    const lines = [
        {
            text: 'kiro-cli --agent livestock-specialist',
            color: 'text-emerald-500',
        },
        {
            text: '[SYSTEM] Initializing specialized knowledge base...',
            color: 'text-neutral-500',
        },
        { text: '@quickstart', color: 'text-cyan-400' },
        {
            text: '✓ Database provisioned via Neon',
            color: 'text-emerald-500/80',
        },
        { text: '✓ Migrations applied (32)', color: 'text-emerald-500/80' },
        {
            text: '✓ Demo data seeded successfully',
            color: 'text-emerald-500/80',
        },
        {
            text: 'Found 3 batches exceeding mortality threshold. Generate report?',
            color: 'text-neutral-300',
        },
        {
            text: 'kiro-cli @financial-report --period last-30d',
            color: 'text-cyan-400',
        },
    ]

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true)
                }
            },
            { threshold: 0.1 },
        )

        if (sectionRef.current) {
            observer.observe(sectionRef.current)
        }

        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (inView) {
            const interval = setInterval(() => {
                setActiveLine((prev) =>
                    prev < lines.length - 1 ? prev + 1 : prev,
                )
            }, 1500)
            return () => clearInterval(interval)
        }
    }, [inView, lines.length])

    return (
        <section
            ref={sectionRef}
            className="py-32 px-6 lg:px-12 relative overflow-hidden transition-colors duration-500"
            style={{ backgroundColor: 'var(--bg-landing-page)' }}
            id="agents"
        >
            <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                {/* Left Content */}
                <div className="lg:col-span-6">
                    <div
                        className={`transition-all duration-1000 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <Bot className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                            </div>
                            <span className="text-xs font-mono uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-500 font-semibold">
                                Intelligence
                            </span>
                        </div>

                        <h2
                            className="text-4xl lg:text-5xl font-manrope font-medium tracking-tighter mb-8 transition-colors duration-500"
                            style={{ color: 'var(--text-landing-primary)' }}
                        >
                            Built for the era of <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400">
                                Autonomous Farming.
                            </span>
                        </h2>

                        <p
                            className="text-lg font-light leading-relaxed mb-10 max-w-xl transition-colors duration-500"
                            style={{ color: 'var(--text-landing-secondary)' }}
                        >
                            OpenLivestock isn't just for humans. Our
                            architecture is meticulously optimized for AI
                            agents, providing the structured data and CLI
                            tooling needed for fully autonomous management.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="flex gap-4">
                                <div className="mt-1">
                                    <Command className="w-5 h-5 text-emerald-500/60" />
                                </div>
                                <div>
                                    <h4
                                        className="font-medium mb-1 transition-colors duration-500"
                                        style={{
                                            color: 'var(--text-landing-primary)',
                                        }}
                                    >
                                        Kiro CLI Integration
                                    </h4>
                                    <p
                                        className="text-sm font-light transition-colors duration-500"
                                        style={{
                                            color: 'var(--text-landing-secondary)',
                                        }}
                                    >
                                        Direct interaction with
                                        livestock-specialized agents.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1">
                                    <Sparkles className="w-5 h-5 text-cyan-500/60 dark:text-cyan-400/60" />
                                </div>
                                <div>
                                    <h4
                                        className="font-medium mb-1 transition-colors duration-500"
                                        style={{
                                            color: 'var(--text-landing-primary)',
                                        }}
                                    >
                                        Agent Shortcuts
                                    </h4>
                                    <p
                                        className="text-sm font-light transition-colors duration-500"
                                        style={{
                                            color: 'var(--text-landing-secondary)',
                                        }}
                                    >
                                        Pre-configured prompts for P&L, growth,
                                        and forecasting.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Terminal Mockup */}
                <div className="lg:col-span-6">
                    <div
                        className={`transition-all duration-1000 delay-300 ${inView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                    >
                        <div className="relative group">
                            {/* Terminal Frame */}
                            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden">
                                {/* Header */}
                                <div className="h-10 border-b border-white/5 bg-white/[0.02] flex items-center px-4 justify-between">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Terminal className="w-3 h-3 text-neutral-600" />
                                        <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">
                                            bash — kiro-cli
                                        </span>
                                    </div>
                                    <div className="w-12" />
                                </div>

                                {/* Body */}
                                <div className="p-6 font-mono text-sm leading-relaxed min-h-[320px]">
                                    {lines.map((line, idx) => (
                                        <div
                                            key={idx}
                                            className={`transition-all duration-500 flex gap-3 ${
                                                idx <= activeLine
                                                    ? 'opacity-100 translate-x-0'
                                                    : 'opacity-0 -translate-x-2'
                                            }`}
                                        >
                                            <span className="text-neutral-700 select-none">
                                                $
                                            </span>
                                            <span className={line.color}>
                                                {line.text}
                                            </span>
                                        </div>
                                    ))}
                                    {activeLine < lines.length - 1 && (
                                        <div className="animate-pulse w-2 h-5 bg-emerald-500/50 mt-1 inline-block ml-6" />
                                    )}
                                </div>
                            </div>

                            {/* Decorative elements */}
                            <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/5 to-cyan-500/5 blur-2xl -z-10 opacity-50 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full" />
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-500/10 blur-[60px] rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
