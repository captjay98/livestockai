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
} from 'lucide-react'
import { useOnboarding } from '~/features/onboarding/context'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'

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
    },
    {
      icon: DollarSign,
      title: t('tour.finance.title', { defaultValue: 'Sales & Expenses' }),
      desc: t('tour.finance.desc', {
        defaultValue: 'Track every transaction - sales and costs.',
      }),
      tip: t('tour.finance.tip', {
        defaultValue: 'Accurate records reveal true profit margins.',
      }),
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
    },
  ]

  const item = items[idx]
  const isLast = idx === items.length - 1

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">
          {t('tour.title', { defaultValue: 'Quick Tour' })}
        </h2>
        <p className="text-muted-foreground">
          {t('tour.summary', {
            defaultValue: 'Explore key features of OpenLivestock',
          })}
        </p>
      </div>
      <div className="flex justify-center gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'w-6 bg-primary' : i < idx ? 'bg-primary/50' : 'bg-muted-foreground/30'}`}
          />
        ))}
      </div>
      <Card className="max-w-lg mx-auto overflow-hidden">
        <div className="bg-primary/5 p-8 flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <item.icon className="h-10 w-10 text-primary" />
          </div>
        </div>
        <CardContent className="pt-6 space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-bold">{item.title}</h3>
            <p className="text-muted-foreground mt-2">{item.desc}</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm">
              <strong>💡 {t('common:tip', { defaultValue: 'Tip' })}:</strong>{' '}
              {item.tip}
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-center gap-3 pt-4">
        <Button
          variant="outline"
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />{' '}
          {t('common:previous', { defaultValue: 'Previous' })}
        </Button>
        <Button
          onClick={() => (isLast ? completeStep('tour') : setIdx((i) => i + 1))}
        >
          {isLast
            ? t('tour.finish', { defaultValue: 'Finish Tour' })
            : t('common:next', { defaultValue: 'Next' })}{' '}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
