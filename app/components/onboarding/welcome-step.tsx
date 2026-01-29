import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  DollarSign,
  Package,
  Rocket,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { useOnboarding } from '~/features/onboarding/context'

export function WelcomeStep() {
  const { t } = useTranslation(['onboarding', 'common'])
  const { completeStep, isAdminAdded } = useOnboarding()

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
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
          <Rocket className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold">
          {t('welcome.title', {
            defaultValue: 'Welcome to LivestockAI!',
          })}
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          {isAdminAdded
            ? t('welcome.descAdmin', {
                defaultValue:
                  "You've been added to a farm. Let's take a quick tour.",
              })
            : t('welcome.descUser', {
                defaultValue:
                  "Let's get your farm set up in just a few minutes.",
              })}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {benefits.map((b) => (
          <Card key={b.title} className="border-2">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {b.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={() => completeStep('welcome')}>
          {t('welcome.start', { defaultValue: 'Get Started' })}{' '}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
