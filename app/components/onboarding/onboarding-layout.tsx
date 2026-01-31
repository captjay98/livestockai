import { useTranslation } from 'react-i18next'
import { SkipForward, Sparkles } from 'lucide-react'
import React, { useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { useOnboarding } from '~/features/onboarding/context'
import { Button } from '~/components/ui/button'
import { Progress } from '~/components/ui/progress'

interface OnboardingLayoutProps {
  children: React.ReactNode
}

export function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const { t } = useTranslation(['onboarding'])
  const { currentStepIndex, totalSteps, skipOnboarding } = useOnboarding()
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

  const progressPercent = ((currentStepIndex + 1) / totalSteps) * 100

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full overflow-x-hidden font-inter transition-colors duration-500 bg-background"
      style={{ backgroundColor: 'var(--bg-landing-page)' }}
    >
      {/* Background Effects matching AuthShell */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-5 transition-opacity duration-300"
        style={{
          background: `radial-gradient(1000px circle at ${mousePosition.x}px ${mousePosition.y}px, var(--landing-grid-color), transparent 40%)`,
        }}
      />

      {/* Hybrid Approach: Subtle Ambient Glows (Very Low Opacity) */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full blur-[120px] opacity-[0.05] pointer-events-none"
        style={{ background: 'var(--neon-glow-secondary)' }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full blur-[120px] opacity-[0.05] pointer-events-none"
        style={{ background: 'var(--neon-glow-primary)' }}
      />

      {/* Hybrid Approach: Tinted Mouse Glow */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-[0.03] pointer-events-none transition-opacity duration-300"
        style={{
          background: 'var(--primary)',
          left: mousePosition.x,
          top: mousePosition.y,
          transform: 'translate(-50%, -50%)',
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

      <div
        className="relative z-10 border-b bg-background/60 backdrop-blur-xl sticky top-0"
        style={{ borderColor: 'var(--border-landing-subtle)' }}
      >
        <div className="container max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              <span
                className="font-semibold"
                style={{ color: 'var(--text-landing-primary)' }}
              >
                {t('header.title', {
                  defaultValue: 'Getting Started',
                })}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipOnboarding}
              className="hover:bg-white/5"
              style={{ color: 'var(--text-landing-secondary)' }}
            >
              <SkipForward className="h-4 w-4 mr-1" />
              {t('header.skip', { defaultValue: 'Skip Setup' })}
            </Button>
          </div>
          <Progress
            value={progressPercent}
            className="h-2 bg-black/5 dark:bg-white/5"
          />
          <div
            className="flex justify-between text-xs mt-1"
            style={{ color: 'var(--text-landing-secondary)' }}
          >
            <span>
              {t('header.step', {
                defaultValue: 'Step {{current}} of {{total}}',
                current: currentStepIndex + 1,
                total: totalSteps,
              })}
            </span>
            <span>
              {t('header.percent', {
                defaultValue: '{{percent}}% complete',
                percent: Math.round(progressPercent),
              })}
            </span>
          </div>
        </div>
      </div>
      <div className="relative z-10 container max-w-4xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  )
}
