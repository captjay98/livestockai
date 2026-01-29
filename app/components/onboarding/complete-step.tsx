import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowRight, Check } from 'lucide-react'
import { useOnboarding } from '~/features/onboarding/context'
import { logger } from '~/lib/logger'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'

export function CompleteStep() {
  const { t } = useTranslation(['onboarding', 'common'])
  const navigate = useNavigate()
  const router = useRouter()
  const { progress } = useOnboarding()
  const [isCompleting, setIsCompleting] = useState(false)

  const items = [
    progress.farmId &&
      t('complete.items.farm', { defaultValue: 'Created your farm' }),
    progress.batchId &&
      t('complete.items.batch', {
        defaultValue: 'Added your first batch',
      }),
    t('complete.items.preferences', {
      defaultValue: 'Configured preferences',
    }),
    t('complete.items.tour', { defaultValue: 'Completed the tour' }),
  ].filter(Boolean)

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      const { markOnboardingCompleteFn } =
        await import('~/features/onboarding/server')
      await markOnboardingCompleteFn({ data: {} })
      // Invalidate router to refresh auth state and providers
      await router.invalidate()
      navigate({ to: '/dashboard' })
    } catch (err) {
      logger.error('Failed to mark onboarding complete:', err)
      await router.invalidate()
      navigate({ to: '/dashboard' })
    }
  }

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600">
          <Check className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold">
          {t('complete.title', {
            defaultValue: "You're All Set! 🎉",
          })}
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          {t('complete.desc', {
            defaultValue: 'Your farm is ready. Start tracking your livestock!',
          })}
        </p>
      </div>
      {items.length > 0 && (
        <Card className="max-w-sm mx-auto">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-3">
              {t('complete.accomplished', {
                defaultValue: 'What you accomplished',
              })}
            </h4>
            <ul className="space-y-2 text-left">
              {items.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" /> {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      <div className="space-y-3">
        <Button size="lg" onClick={handleComplete} disabled={isCompleting}>
          {isCompleting
            ? t('complete.finishing', {
                defaultValue: 'Finishing...',
              })
            : t('complete.submit', {
                defaultValue: 'Go to Dashboard',
              })}{' '}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <p className="text-sm text-muted-foreground">
          {t('complete.help', {
            defaultValue: 'Need help? Restart the tour anytime from Settings.',
          })}
        </p>
      </div>
    </div>
  )
}
