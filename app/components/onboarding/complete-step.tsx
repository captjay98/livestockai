import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check, Sparkles, Trophy } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useOnboarding } from '~/features/onboarding/context'
import { logger } from '~/lib/logger'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { cn } from '~/lib/utils'

export function CompleteStep() {
  const { t } = useTranslation(['onboarding', 'common'])
  const { progress } = useOnboarding()
  const [isCompleting, setIsCompleting] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    // Show "confetti" effect after a small delay
    const timer = setTimeout(() => setShowConfetti(true), 500)
    return () => clearTimeout(timer)
  }, [])

  const items = [
    {
      id: 'farm',
      done: !!progress.farmId,
      label: t('complete.items.farm', { defaultValue: 'Created your farm' }),
    },
    {
      id: 'batch',
      done: progress.completedSteps.includes('create-batch'),
      label: t('complete.items.batch', {
        defaultValue: 'Added your first batch',
      }),
    },
    {
      id: 'preferences',
      done: true,
      label: t('complete.items.preferences', {
        defaultValue: 'Configured preferences',
      }),
    },
    {
      id: 'tour',
      done: true,
      label: t('complete.items.tour', { defaultValue: 'Completed the tour' }),
    },
  ]

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      const { markOnboardingCompleteFn } =
        await import('~/features/onboarding/server')
      await markOnboardingCompleteFn({ data: {} })

      // Force a full page reload to bypass router cache
      // This ensures the _auth loader runs fresh and sees the updated onboardingCompleted flag
      window.location.replace('/dashboard')
    } catch (err) {
      logger.error('Failed to mark onboarding complete:', err)
      // Even on error, try to navigate - the DB update may have succeeded
      window.location.replace('/dashboard')
    }
  }

  return (
    <div className="space-y-10 relative">
      {/* Background Decor */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="space-y-6 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-primary/10 text-primary border border-primary/20 shadow-xl shadow-primary/5 relative"
        >
          <Trophy className="h-12 w-12" />
          <AnimatePresence>
            {showConfetti && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, x: 0, y: 0 }}
                    animate={{
                      scale: 1,
                      x: Math.cos((i * 60 * Math.PI) / 180) * 60,
                      y: Math.sin((i * 60 * Math.PI) / 180) * 60,
                      opacity: 0,
                    }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="absolute h-2 w-2 rounded-full bg-primary"
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent">
              {t('complete.title', {
                defaultValue: "You're All Set!",
              })}
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-muted-foreground max-w-md mx-auto"
          >
            {t('complete.desc', {
              defaultValue:
                "Your digital farm is ready. Let's start managing your livestock with AI.",
            })}
          </motion.p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="max-w-sm mx-auto border-white/20 bg-white/40 dark:bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden glass-card">
          <CardContent className="pt-8 pb-8 px-8">
            <h4 className="font-bold text-sm uppercase tracking-wider text-primary/70 mb-6 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {t('complete.accomplished', {
                defaultValue: 'Onboarding Highlights',
              })}
            </h4>
            <ul className="space-y-5">
              {items.map((item, i) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className={cn(
                    'flex items-center gap-4 transition-all duration-300',
                    item.done ? 'opacity-100' : 'opacity-40 grayscale',
                  )}
                >
                  <div
                    className={cn(
                      'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border',
                      item.done
                        ? 'bg-primary/20 border-primary/30 text-primary'
                        : 'bg-muted border-muted-foreground/20 text-muted-foreground',
                    )}
                  >
                    <Check className="h-3.5 w-3.5 bold" />
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>

      <div className="space-y-4 pt-4 text-center">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            size="lg"
            onClick={handleComplete}
            disabled={isCompleting}
            className="rounded-full px-12 h-14 text-lg shadow-xl shadow-primary/20 group"
          >
            {isCompleting
              ? t('complete.finishing', {
                  defaultValue: 'Launching...',
                })
              : t('complete.submit', {
                  defaultValue: 'Go to Dashboard',
                })}{' '}
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <ArrowRight className="ml-2 h-5 w-5" />
            </motion.div>
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-xs text-muted-foreground/60 px-8"
        >
          {t('complete.help', {
            defaultValue:
              'Tip: You can change your farm settings or restart the tour anytime from the Settings page.',
          })}
        </motion.p>
      </div>
    </div>
  )
}
