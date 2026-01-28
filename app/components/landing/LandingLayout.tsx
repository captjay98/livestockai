import { useEffect } from 'react'
import { InteractiveBackground } from './InteractiveBackground'
import { LandingNavbar } from './LandingNavbar'
import { LandingFooter } from './LandingFooter'
import type { ReactNode } from 'react'

interface LandingLayoutProps {
    children: ReactNode
    variant?: string
}

export function LandingLayout({ children }: LandingLayoutProps) {
    useEffect(() => {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px',
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible')
                }
            })
        }, observerOptions)

        document
            .querySelectorAll('section, .reveal-group, .stagger-grid')
            .forEach((el) => observer.observe(el))

        return () => observer.disconnect()
    }, []) // Added empty dependency array to run only once

    return (
        <div
            className="relative min-h-screen w-full overflow-x-hidden font-inter transition-colors duration-500"
            style={{
                backgroundColor: 'var(--bg-landing-page)',
                color: 'var(--text-landing-secondary)',
            }}
        >
            <InteractiveBackground />

            <LandingNavbar />

            <main className="relative z-10">{children}</main>

            <LandingFooter />
        </div>
    )
}
