import { useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { MouseEvent, ReactNode } from 'react'
import { Logo } from '~/components/logo'
import { LanguageSwitcher } from '~/components/ui/language-switcher'

interface AuthShellProps {
    children: ReactNode
    title: string
    subtitle?: string
}

export function AuthShell({ children, title, subtitle }: AuthShellProps) {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const containerRef = useRef<HTMLDivElement>(null)

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        })
    }

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="min-h-screen w-full relative overflow-hidden flex flex-col items-center justify-center p-4 transition-colors duration-500"
            style={{ backgroundColor: 'var(--bg-landing-page)' }}
        >
            {/* Background Effects */}
            <div
                className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-5 transition-opacity duration-300"
                style={{
                    background: `radial-gradient(1000px circle at ${mousePosition.x}px ${mousePosition.y}px, var(--landing-grid-color), transparent 40%)`,
                }}
            />
            {/* Grid Overlay */}
            <div
                className="absolute inset-0 opacity-[0.05]"
                style={{
                    backgroundImage:
                        'linear-gradient(var(--landing-grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--landing-grid-color) 1px, transparent 1px)',
                    backgroundSize: '50px 50px',
                    maskImage:
                        'radial-gradient(circle at 50% 50%, black, transparent 90%)',
                }}
            />

            {/* Top Bar */}
            <div className="absolute top-6 right-6 flex items-center gap-4 z-20">
                <LanguageSwitcher showLabel={false} />
            </div>

            {/* Main Card */}
            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block mb-8 group">
                        <div
                            className="p-4 rounded-2xl border backdrop-blur-md bg-white/5 transition-transform duration-500 group-hover:scale-105"
                            style={{ borderColor: 'var(--border-landing-subtle)' }}
                        >
                            <Logo className="h-10 w-auto" />
                        </div>
                    </Link>

                    <h1
                        className="text-3xl font-bold tracking-tight mb-3"
                        style={{ color: 'var(--text-landing-primary)' }}
                    >
                        {title}
                    </h1>
                    {subtitle && (
                        <p
                            className="font-light text-lg"
                            style={{ color: 'var(--text-landing-secondary)' }}
                        >
                            {subtitle}
                        </p>
                    )}
                </div>

                <div
                    className="rounded-3xl border backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden"
                    style={{
                        backgroundColor: 'var(--bg-landing-card)',
                        borderColor: 'var(--border-landing-subtle)',
                    }}
                >
                    {/* Top Shine */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    {children}
                </div>
            </div>
        </div>
    )
}
