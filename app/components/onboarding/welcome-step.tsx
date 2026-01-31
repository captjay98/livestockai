import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  DollarSign,
  Package,
  Rocket,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { Button } from '~/components/ui/button'
import { useOnboarding } from '~/features/onboarding/context'

export function WelcomeStep() {
  const { t } = useTranslation(['onboarding', 'common'])
  const { completeStep, isAdminAdded } = useOnboarding()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100)
  }, [])

  const benefits = [
    {
      icon: Package,
      title: t('welcome.benefits.livestock.title', {
        defaultValue: 'Track Your Livestock',
      }),
      description: t('welcome.benefits.livestock.desc', {
        defaultValue: 'Monitor batches from acquisition to sale',
      }),
    },
    {
      icon: BarChart3,
      title: t('welcome.benefits.growth.title', {
        defaultValue: 'Growth Forecasting',
      }),
      description: t('welcome.benefits.growth.desc', {
        defaultValue: 'Predict harvest dates and weights',
      }),
    },
    {
      icon: DollarSign,
      title: t('welcome.benefits.financials.title', {
        defaultValue: 'Financial Insights',
      }),
      description: t('welcome.benefits.financials.desc', {
        defaultValue: 'Track costs, revenue, and profit margins',
      }),
    },
    {
      icon: ClipboardList,
      title: t('welcome.benefits.records.title', {
        defaultValue: 'Complete Records',
      }),
      description: t('welcome.benefits.records.desc', {
        defaultValue: 'Feed, mortality, vaccinations, and more',
      }),
    },
  ]

  return (
    <div
      className={`relative min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-12 transition-opacity duration-700 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Background Grid - Adapted from LandingHero */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(var(--landing-grid-color) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage:
            'radial-gradient(circle at 50% 50%, black, transparent 80%)',
          opacity: '0.5',
        }}
      />

      <div className="relative z-10 text-center space-y-6 max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 backdrop-blur-sm shadow-[0_0_30px_rgba(16,185,129,0.2)] mb-4 animate-bounce-slow">
          <Rocket className="h-10 w-10 text-emerald-500" />
        </div>

        <h1
          className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text"
          style={{
            backgroundImage:
              'linear-gradient(135deg, var(--text-landing-primary) 0%, var(--text-landing-secondary) 100%)',
          }}
        >
          {t('welcome.title', {
            defaultValue: 'Welcome to LivestockAI!',
          })}
        </h1>

        <p className="text-xl text-muted-foreground leading-relaxed">
          {isAdminAdded
            ? t('welcome.descAdmin', {
                defaultValue:
                  "You've been added to a farm. Let's take a quick tour.",
              })
            : t('welcome.descUser', {
                defaultValue:
                  "Let's get your farm set up in just a vew minutes.",
              })}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 relative z-10 w-full max-w-4xl">
        {benefits.map((b, i) => (
          <div
            key={b.title}
            className="group relative p-6 rounded-xl border border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:bg-white/10 dark:hover:bg-white/10 hover:border-emerald-500/30 hover:shadow-xl"
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            <div className="flex gap-5 items-start">
              <div className="shrink-0 w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <b.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {b.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="relative z-10 pt-8 animate-fade-up"
        style={{ animationDelay: '600ms' }}
      >
        <Button
          size="lg"
          onClick={() => completeStep('welcome')}
          className="h-14 px-8 text-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
        >
          {t('welcome.start', { defaultValue: 'Get Started' })}{' '}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
