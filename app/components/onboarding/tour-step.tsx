import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  DollarSign,
  Home,
  Package,
  Settings,
  Sparkles,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useOnboarding } from '~/features/onboarding/context'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { cn } from '~/lib/utils'

export function TourStep() {
  const { t } = useTranslation([
    'onboarding',
    'common',
    'batches',
    'reports',
    'settings',
  ])
  const { completeStep } = useOnboarding()
  const [idx, setIdx] = useState(0)
  const [direction, setDirection] = useState(0)

  const items = [
    {
      icon: Home,
      title: t('tour.dashboard.title', { defaultValue: 'Dashboard' }),
      desc: t('tour.dashboard.desc', {
        defaultValue: 'Your command center - see farm health at a glance.',
      }),
      tip: t('tour.dashboard.tip', {
        defaultValue: 'Check daily to stay on top of operations.',
      }),
      color: 'from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-blue-500',
    },
    {
      icon: Package,
      title: t('batches:title', { defaultValue: 'Batches' }),
      desc: t('tour.batches.desc', {
        defaultValue:
          'View batches, record feed, log mortality, track weights.',
      }),
      tip: t('tour.batches.tip', {
        defaultValue: 'Click any batch for detailed records.',
      }),
      color: 'from-orange-500/20 to-amber-500/20',
      iconColor: 'text-orange-500',
    },
    {
      icon: DollarSign,
      title: t('tour.finance.title', {
        defaultValue: 'Sales & Expenses',
      }),
      desc: t('tour.finance.desc', {
        defaultValue: 'Track every transaction - sales and costs.',
      }),
      tip: t('tour.finance.tip', {
        defaultValue: 'Accurate records reveal true profit margins.',
      }),
      color: 'from-emerald-500/20 to-teal-500/20',
      iconColor: 'text-emerald-500',
    },
    {
      icon: BarChart3,
      title: t('reports:title', { defaultValue: 'Reports' }),
      desc: t('tour.reports.desc', {
        defaultValue:
          'Growth curves, batch comparisons, profitability analysis.',
      }),
      tip: t('tour.reports.tip', {
        defaultValue: 'Identify which batches perform best.',
      }),
      color: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-purple-500',
    },
    {
      icon: Settings,
      title: t('settings:title', { defaultValue: 'Settings' }),
      desc: t('tour.settings.desc', {
        defaultValue: 'Manage modules, preferences, and account.',
      }),
      tip: t('tour.settings.tip', {
        defaultValue: 'Enable only modules you need.',
      }),
      color: 'from-slate-500/20 to-gray-500/20',
      iconColor: 'text-slate-500',
    },
  ]

  const item = items[idx]
  const isLast = idx === items.length - 1

  const nextStep = () => {
    if (isLast) {
      completeStep('tour')
    } else {
      setDirection(1)
      setIdx((i) => i + 1)
    }
  }

  const prevStep = () => {
    setDirection(-1)
    setIdx((i) => Math.max(0, i - 1))
  }

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 100 : -100,
      opacity: 0,
    }),
  }

  return (
    <div className="space-y-8 relative">
      {/* Background Decor */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] animate-pulse delay-700" />
      </div>

      <div className="text-center space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2 border border-primary/20"
        >
          <Sparkles className="h-3 w-3" />
          {t('tour.badge', { defaultValue: 'Feature Overview' })}
        </motion.div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent">
          {t('tour.title', { defaultValue: 'Quick Tour' })}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {t('tour.summary', {
            defaultValue: 'Explore key features of LivestockAI',
          })}
        </p>
      </div>

      <div className="flex justify-center gap-3">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setDirection(i > idx ? 1 : -1)
              setIdx(i)
            }}
            className={cn(
              'h-1.5 rounded-full transition-all duration-500',
              i === idx
                ? 'w-10 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]'
                : i < idx
                  ? 'w-4 bg-primary/40'
                  : 'w-4 bg-muted/40 hover:bg-muted/60',
            )}
          />
        ))}
      </div>

      <div className="relative h-[420px] max-w-lg mx-auto">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={idx}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0"
          >
            <Card className="h-full overflow-hidden border-white/20 bg-white/40 dark:bg-black/40 backdrop-blur-xl shadow-2xl relative">
              <div
                className={cn(
                  'h-48 flex items-center justify-center transition-colors duration-700 bg-gradient-to-br',
                  item.color,
                )}
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-24 h-24 rounded-3xl bg-white/50 dark:bg-black/50 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20"
                >
                  <item.icon className={cn('h-12 w-12', item.iconColor)} />
                </motion.div>
              </div>
              <CardContent className="pt-8 space-y-6">
                <div className="text-center space-y-3">
                  <h3 className="text-2xl font-bold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed italic">
                    "{item.desc}"
                  </p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-primary/5 dark:bg-primary/10 border border-primary/10 p-4 rounded-2xl relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <p className="text-sm relative z-10 flex gap-3">
                    <span className="text-primary font-bold">💡</span>
                    <span>
                      <span className="font-semibold text-primary/80 mr-1">
                        {t('common:tip', { defaultValue: 'Pro Tip' })}:
                      </span>
                      {item.tip}
                    </span>
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-4 pt-4">
        <Button
          variant="outline"
          size="lg"
          onClick={prevStep}
          disabled={idx === 0}
          className="rounded-full px-8 border-white/20 bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all active:scale-95 disabled:opacity-30"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />{' '}
          {t('common:previous', { defaultValue: 'Back' })}
        </Button>
        <Button
          size="lg"
          onClick={nextStep}
          className="rounded-full px-8 shadow-xl shadow-primary/20 transition-all active:scale-95 group"
        >
          {isLast
            ? t('tour.finish', { defaultValue: "Done! Let's go" })
            : t('common:next', { defaultValue: 'Next Step' })}{' '}
          <motion.div
            animate={{ x: isLast ? 0 : [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <ArrowRight className="ml-2 h-4 w-4" />
          </motion.div>
        </Button>
      </div>
    </div>
  )
}
